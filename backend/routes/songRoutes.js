const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prismaClient"); // Prisma database connection
const { protect } = require("../middleware/authMiddleware"); // Requires authentication

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const { createClient } = require("@supabase/supabase-js");
const {
  attachPlayableUrl,
  attachPlayableUrls,
  extractStorageReference,
  toSignedPlaybackUrl,
} = require("../lib/mediaStorage");

let supabase = null;
const getSupabase = () => {
  if (supabase) return supabase;
  if (supabaseUrl && supabaseServiceKey) {
    // If the URL is the placeholder example (commonly present in env during CI/dev), avoid creating a real client.
    if (supabaseUrl.includes("example.supabase.co")) return null;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (e) {
      supabase = null;
      console.error("Failed to create Supabase client:", e?.message ?? e);
    }
  }
  return supabase;
};

// Allow tests to inject a mocked supabase client
router.setSupabaseClient = (client) => {
  supabase = client;
};

const normalizeSearchValue = (value) =>
  typeof value === "string" ? value.trim().toLocaleLowerCase() : "";

const getSearchRank = (song, search) => {
  const normalizedSearch = normalizeSearchValue(search);
  const normalizedTitle = normalizeSearchValue(song.title);
  const normalizedArtist = normalizeSearchValue(song.artist);

  if (!normalizedSearch) {
    return 99;
  }

  if (
    normalizedTitle === normalizedSearch ||
    normalizedArtist === normalizedSearch
  ) {
    return 0;
  }

  if (
    normalizedTitle.startsWith(normalizedSearch) ||
    normalizedArtist.startsWith(normalizedSearch)
  ) {
    return 1;
  }

  if (normalizedTitle.includes(normalizedSearch)) {
    return 2;
  }

  if (normalizedArtist.includes(normalizedSearch)) {
    return 3;
  }

  return 4;
};

// @desc    Publish a new song
// @route   POST /api/songs
// @access  Private (Requires token)
router.post("/", protect, async (req, res) => {
  try {
    const { title, artist, url, imageUrl } = req.body;

    if (!title || !artist || !url) {
      return res
        .status(400)
        .json({ message: "Title, artist, and url are required fields" });
    }

    // Fetch user ID from Prisma based on token's email
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create new song in the database
    const newSong = await prisma.song.create({
      data: {
        title,
        artist,
        url,
        imageUrl: imageUrl || null,
        userId: user.id, // Connects the song to the publishing user
      },
    });

    res.status(201).json(newSong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while creating song" });
  }
});

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch all songs and include publisher (User) details and likes
    const songs = await prisma.song.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        ratings: true,
      },
    });

    const sortedSongs = search
      ? songs.sort((left, right) => {
          const rankDifference =
            getSearchRank(left, search) - getSearchRank(right, search);

          if (rankDifference !== 0) {
            return rankDifference;
          }

          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        })
      : songs.sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        );

    res.json(await attachPlayableUrls(sortedSongs));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching songs" });
  }
});

// @desc    Get top rated songs
// @route   GET /api/songs/top/rated
// @access  Public
router.get("/top/rated", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10;
    const userId = req.query.userId;

    const songs = await prisma.song.findMany({
      where: userId ? { userId } : {},
      include: {
        user: { select: { username: true, avatarUrl: true } },
        ratings: true,
      },
    });

    const songsWithRating = songs.map((song) => {
      const totalScore = song.ratings.reduce((acc, r) => acc + r.score, 0);
      return {
        ...song,
        averageRating:
          song.ratings.length > 0 ? totalScore / song.ratings.length : 0,
        ratingCount: song.ratings.length,
      };
    });

    songsWithRating.sort(
      (a, b) =>
        b.ratingCount - a.ratingCount || b.averageRating - a.averageRating,
    );

    res.json(await attachPlayableUrls(songsWithRating.slice(0, limit)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching top songs" });
  }
});

// @desc    Rate a song
// @route   POST /api/songs/:id/rate
// @access  Private
router.post("/:id/rate", protect, async (req, res) => {
  try {
    const songId = req.params.id;
    const { score } = req.body;

    if (typeof score !== "number" || score < 1 || score > 5) {
      return res
        .status(400)
        .json({ message: "Score must be a number between 1 and 5" });
    }

    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) return res.status(404).json({ message: "Song not found" });

    const rating = await prisma.rating.upsert({
      where: {
        userId_songId: {
          userId: user.id,
          songId: songId,
        },
      },
      update: {
        score: score,
      },
      create: {
        userId: user.id,
        songId: songId,
        score: score,
      },
    });

    res.status(200).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while rating song" });
  }
});

// @desc    Delete rating from a song
// @route   DELETE /api/songs/:id/rate
// @access  Private
router.delete("/:id/rate", protect, async (req, res) => {
  try {
    const songId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_songId: {
          userId: user.id,
          songId: songId,
        },
      },
    });

    if (!existingRating) {
      return res.status(400).json({ message: "Song not rated" });
    }

    await prisma.rating.delete({
      where: {
        userId_songId: {
          userId: user.id,
          songId: songId,
        },
      },
    });

    res.json({ message: "Rating removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while removing rating" });
  }
});

// @desc    Get a single song by ID
// @route   GET /api/songs/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        ratings: true,
      },
    });

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    res.json(await attachPlayableUrl(song));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching song" });
  }
});

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private (owner only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
    });

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (song.userId !== user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this song" });
    }

    const audioReference = extractStorageReference(song.url, "songs");
    const client = getSupabase();
    if (client && audioReference) {
      const { error: removeAudioError } = await client.storage
        .from(audioReference.bucket)
        .remove([audioReference.path]);

      if (removeAudioError) {
        console.error(
          "Failed to remove audio file from storage:",
          removeAudioError,
        );
      }
    }

    const imageReference = extractStorageReference(song.imageUrl, "covers");
    if (client && imageReference) {
      const { error: removeImageError } = await client.storage
        .from(imageReference.bucket)
        .remove([imageReference.path]);

      if (removeImageError) {
        console.error(
          "Failed to remove image file from storage:",
          removeImageError,
        );
      }
    }

    await prisma.rating.deleteMany({
      where: { songId: song.id },
    });

    await prisma.song.delete({
      where: { id: song.id },
    });

    res.json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting song" });
  }
});
router.extractStorageReference = extractStorageReference;
router.toSignedPlaybackUrl = toSignedPlaybackUrl;
router.attachPlayableUrl = attachPlayableUrl;
module.exports = router;

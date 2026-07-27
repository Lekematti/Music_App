import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { apiFetch, setAuthHeaders } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { usePlayer, type PlayerTrack } from "@/components/player";
import { homeStyles } from "@/styles/home";

type SongUser = {
  username?: string;
  avatarUrl?: string | null;
};

type Song = {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string | null;
  url?: string | null;
  user?: SongUser;
  averageRating?: number;
  ratings?: Array<{ score: number }>;
};

export default function AppHomeScreen() {
  const { playTrack } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [newUploads, setNewUploads] = useState<Song[]>([]);
  const [pastUploads, setPastUploads] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHome() {
      try {
        const currentToken = getToken();

        if (!currentToken) {
          router.replace("/(auth)/login");
          return;
        }

        const authHeaders = (setAuthHeaders(currentToken) ?? {}) as Record<
          string,
          string
        >;

        const [topSongsData, allSongsData, meData] = await Promise.all([
          apiFetch("/api/songs/top/rated?limit=10"),
          apiFetch("/api/songs"),
          apiFetch("/api/auth/me", {
            headers: authHeaders,
          }),
        ]);

        const allSongs = Array.isArray(allSongsData) ? allSongsData : [];
        const topSongsList = Array.isArray(topSongsData) ? topSongsData : [];

        setTopSongs(topSongsList.slice(0, 10));
        setNewUploads(allSongs.slice(0, 10));

        const userId = meData?.id;
        if (userId) {
          const userSongsData = await apiFetch(`/api/songs?userId=${userId}`);
          setPastUploads(
            Array.isArray(userSongsData) ? userSongsData.slice(0, 10) : [],
          );
        } else {
          setPastUploads([]);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load home data";
        setError(message);
        Alert.alert("Failed to load home", message);
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, []);

  return (
    <ScrollView
      style={homeStyles.screen}
      contentContainerStyle={homeStyles.content}
    >
      <View style={homeStyles.header}>
        <Text style={homeStyles.brand}>Music App</Text>
        <Pressable onPress={handleLogout} style={homeStyles.logoutButton}>
          <Text style={homeStyles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={homeStyles.loadingWrap}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={homeStyles.loadingText}>Loading home...</Text>
        </View>
      )}

      {error && (
        <View style={homeStyles.errorCard}>
          <Text style={homeStyles.errorTitle}>Could not load home</Text>
          <Text style={homeStyles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <>
          <Section title="Top 10">
            {topSongs.length === 0 ? (
              <EmptyState text="No top songs available yet." />
            ) : (
              topSongs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPress={() => openSong(song, playTrack)}
                />
              ))
            )}
          </Section>

          <Section title="Past Uploads">
            {pastUploads.length === 0 ? (
              <EmptyState text="You haven't uploaded any music yet." />
            ) : (
              pastUploads.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPress={() => openSong(song, playTrack)}
                />
              ))
            )}
          </Section>

          <Section title="New Uploads">
            {newUploads.length === 0 ? (
              <EmptyState text="No songs uploaded yet." />
            ) : (
              newUploads.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onPress={() => openSong(song, playTrack)}
                />
              ))
            )}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function handleLogout() {
  clearToken();
  router.replace("/(auth)/login");
}

function openSong(
  song: Song,
  playTrack: (track: PlayerTrack) => Promise<void>,
) {
  void playTrack({
    id: song.id,
    title: song.title,
    artist: song.artist,
    imageUrl: song.imageUrl,
    url: song.url,
  });

  router.push({ pathname: "/(app)/song/[id]", params: { id: song.id } });
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={homeStyles.section}>
      <View style={homeStyles.sectionHeader}>
        <Text style={homeStyles.sectionTitle}>{title}</Text>
      </View>
      <View style={homeStyles.sectionBody}>{children}</View>
    </View>
  );
}

function SongRow({
  song,
  onPress,
}: {
  readonly song: Song;
  readonly onPress: () => void;
}) {
  return (
    <Pressable style={homeStyles.songCard} onPress={onPress}>
      <View style={homeStyles.songInfo}>
        <Text style={homeStyles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={homeStyles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      <View style={homeStyles.songMeta}>
        <Text style={homeStyles.songMetaText}>
          {typeof song.averageRating === "number"
            ? song.averageRating.toFixed(1)
            : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ text }: { readonly text: string }) {
  return (
    <View style={homeStyles.emptyState}>
      <Text style={homeStyles.emptyText}>{text}</Text>
    </View>
  );
}

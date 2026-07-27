import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { usePlayer, type PlayerTrack } from "@/components/player";
import { apiFetch } from "@/lib/api";

type Song = {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string | null;
  url?: string | null;
  averageRating?: number;
  ratings?: Array<{ score: number }>;
};

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playTrack } = usePlayer();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSong() {
      if (!id) {
        setError("Missing song id.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch(`/api/songs/${id}`);
        setSong(data as Song);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load song";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [id]);

  const handlePlay = async () => {
    if (!song) return;

    const track: PlayerTrack = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      imageUrl: song.imageUrl,
      url: song.url,
    };

    await playTrack(track);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0b0b0f",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: "#ffffff", marginTop: 12 }}>Loading song...</Text>
      </View>
    );
  }

  if (error || !song) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0b0b0f",
          padding: 24,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "700" }}>
          Song unavailable
        </Text>
        <Text style={{ color: "#b5b5c0", marginTop: 8 }}>
          {error ?? "The requested song could not be loaded."}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            alignSelf: "flex-start",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: "#2a6cff",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0b0b0f" }}
      contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
    >
      <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Text style={{ color: "#8cbcff", fontWeight: "700" }}>← Back</Text>
      </Pressable>

      <View
        style={{
          backgroundColor: "#15161c",
          borderWidth: 1,
          borderColor: "#24252d",
          borderRadius: 24,
          padding: 20,
          gap: 16,
        }}
      >
        <View style={{ alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              backgroundColor: "#23242d",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#8cbcff", fontSize: 42 }}>♫</Text>
          </View>
          <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "700" }}>
            {song.title}
          </Text>
          <Text style={{ color: "#b5b5c0", fontSize: 16 }}>{song.artist}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => void handlePlay()}
            style={{
              flex: 1,
              backgroundColor: "#2a6cff",
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>Play</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)")}
            style={{
              flex: 1,
              backgroundColor: "#1d1f28",
              borderRadius: 999,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>
              Back home
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: "#101218",
            borderRadius: 16,
            padding: 16,
            gap: 6,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>Details</Text>
          <Text style={{ color: "#b5b5c0" }}>
            Rating:{" "}
            {typeof song.averageRating === "number"
              ? song.averageRating.toFixed(1)
              : "0.0"}
          </Text>
          <Text style={{ color: "#b5b5c0" }}>
            Ratings: {song.ratings?.length ?? 0}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

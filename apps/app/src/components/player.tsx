import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string | null;
  url?: string | null;
};

type PlayerContextValue = {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  isReady: boolean;
  playTrack: (track: PlayerTrack) => Promise<void>;
  togglePlayback: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { readonly children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const unloadCurrentSound = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.stopAsync();
    } catch {
      // Ignore stop errors when the sound has already ended or isn't loaded.
    }

    try {
      await soundRef.current.unloadAsync();
    } catch {
      // Ignore unload errors for stale or already-unloaded sounds.
    }

    soundRef.current = null;
  }, []);

  const playTrack = useCallback(
    async (track: PlayerTrack) => {
      if (!track.url) {
        Alert.alert(
          "Playback unavailable",
          "This track is missing a playable URL.",
        );
        return;
      }

      setCurrentTrack(track);
      setIsReady(false);
      await unloadCurrentSound();

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setIsReady(true);
    },
    [unloadCurrentSound],
  );

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) {
      if (currentTrack?.url) {
        await playTrack(currentTrack);
      }
      return;
    }

    const status = await soundRef.current.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (status.isLoaded) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [currentTrack?.url, playTrack]);

  useEffect(() => {
    return () => {
      void unloadCurrentSound();
    };
  }, [unloadCurrentSound]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      isPlaying,
      isReady,
      playTrack,
      togglePlayback,
    }),
    [currentTrack, isPlaying, isReady, playTrack, togglePlayback],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
}

export function PlayerBar() {
  const { currentTrack, isPlaying, togglePlayback } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      <Pressable
        style={styles.playButton}
        onPress={() => void togglePlayback()}
      >
        <Text style={styles.playText}>{isPlaying ? "Pause" : "Play"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#12141c",
    borderColor: "#2a2d38",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  artist: {
    color: "#8f95a5",
    fontSize: 13,
    marginTop: 2,
  },
  playButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#2a6cff",
  },
  playText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});

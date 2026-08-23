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
import { Audio, type AVPlaybackStatus } from "expo-av";

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
  const pendingSoundRef = useRef<Audio.Sound | null>(null);
  const playRequestIdRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const unloadSound = useCallback(async (sound: Audio.Sound | null) => {
    if (!sound) return;

    try {
      await sound.stopAsync();
    } catch {
      // no-op
    }

    try {
      await sound.unloadAsync();
    } catch {
      // no-op
    }
  }, []);

  const unloadCurrentSound = useCallback(async () => {
    await unloadSound(soundRef.current);
    await unloadSound(pendingSoundRef.current);
    soundRef.current = null;
    pendingSoundRef.current = null;
  }, [unloadSound]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(status.isPlaying);
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

      const requestId = ++playRequestIdRef.current;
      setCurrentTrack(track);
      setIsReady(false);
      setIsPlaying(false);

      await unloadCurrentSound();

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.url },
          { shouldPlay: true },
          onPlaybackStatusUpdate,
          false,
        );

        pendingSoundRef.current = sound;

        if (requestId !== playRequestIdRef.current) {
          await unloadSound(sound);
          if (pendingSoundRef.current === sound) {
            pendingSoundRef.current = null;
          }
          return;
        }

        soundRef.current = sound;
        pendingSoundRef.current = null;
        setIsReady(true);
      } catch (error) {
        if (requestId === playRequestIdRef.current) {
          setIsReady(false);
          setIsPlaying(false);
          Alert.alert(
            "Playback error",
            error instanceof Error
              ? error.message
              : "Could not start playback.",
          );
        }
      }
    },
    [onPlaybackStatusUpdate, unloadCurrentSound, unloadSound],
  );

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) {
      if (currentTrack?.url) {
        await playTrack(currentTrack);
      }
      return;
    }

    const status = await soundRef.current.getStatusAsync();

    if (!status.isLoaded) {
      return;
    }

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    await soundRef.current.playAsync();
    setIsPlaying(true);
  }, [currentTrack, playTrack]);

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

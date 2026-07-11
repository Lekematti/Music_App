import { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function AppHomeScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = getToken();

        if (!token) {
          router.replace("/(auth)/login");
          return;
        }

        const data = await apiFetch("/api/songs");
        setMessage(
          `Loaded ${Array.isArray(data) ? data.length : 0} songs from the backend.`,
        );
      } catch (error) {
        Alert.alert(
          "Failed to load data",
          error instanceof Error ? error.message : "Unknown error",
        );
        setMessage("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music App</Text>
      <Text style={styles.text}>{loading ? "Loading..." : message}</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  text: {
    fontSize: 16,
  },
});

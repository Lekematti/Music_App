import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";

import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { authStyles } from "@/styles/auth";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter username, email, and password.");
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert(
        "Invalid username",
        "Username must be at least 3 characters.",
      );
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!data.token) {
        throw new Error("Registration succeeded but no token was returned.");
      }

      setToken(data.token);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={authStyles.screen}>
      <View style={authStyles.logoWrap}>
        <Text style={authStyles.logo}>Metallia</Text>
      </View>

      <View style={authStyles.card}>
        <Text style={authStyles.title}>Create new account</Text>

        <Text style={authStyles.label}>Username</Text>
        <TextInput
          placeholder="Username"
          placeholderTextColor="#8a8a95"
          value={username}
          onChangeText={setUsername}
          style={authStyles.input}
        />

        <Text style={authStyles.label}>Email</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#8a8a95"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={authStyles.input}
        />

        <Text style={authStyles.label}>Password</Text>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#8a8a95"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={authStyles.input}
        />

        <Pressable
          style={({ pressed }) => [
            authStyles.button,
            pressed && authStyles.buttonPressed,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0b0f" />
          ) : (
            <Text style={authStyles.buttonText}>Register</Text>
          )}
        </Pressable>

        <Text style={authStyles.footer}>
          Already have an account?{" "}
          <Link href="/(auth)/login" style={authStyles.link}>
            Login
          </Link>
        </Text>
      </View>
    </View>
  );
}

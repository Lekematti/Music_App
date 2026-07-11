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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!data.token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      setToken(data.token);
      router.replace("/(app)");
    } catch (error) {
      Alert.alert(
        "Login failed",
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
        <Text style={authStyles.title}>Login</Text>

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

        <Link href="/(auth)/forgot-password" style={authStyles.link}>
          Forgot password?
        </Link>

        <Pressable
          style={({ pressed }) => [
            authStyles.button,
            pressed && authStyles.buttonPressed,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0b0f" />
          ) : (
            <Text style={authStyles.buttonText}>Login</Text>
          )}
        </Pressable>

        <Text style={authStyles.footer}>
          Don't have an account?{" "}
          <Link href="/(auth)/register" style={authStyles.link}>
            Register
          </Link>
        </Text>
      </View>
    </View>
  );
}

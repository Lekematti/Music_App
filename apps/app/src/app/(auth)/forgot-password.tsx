import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";

import { apiFetch } from "@/lib/api";
import { authStyles } from "@/styles/auth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendResetLink() {
    if (!email.trim()) {
      Alert.alert("Missing field", "Enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      Alert.alert(
        "Reset link sent",
        "If that email exists, a reset link has been sent.",
      );
      setEmail("");
    } catch (error) {
      Alert.alert(
        "Request failed",
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
        <Text style={authStyles.title}>Forgot Password</Text>

        <Text style={authStyles.helperText}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

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

        <Pressable
          style={({ pressed }) => [
            authStyles.button,
            pressed && authStyles.buttonPressed,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleSendResetLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0b0f" />
          ) : (
            <Text style={authStyles.buttonText}>Send Reset Link</Text>
          )}
        </Pressable>

        <Text style={authStyles.footer}>
          Remembered your password?{" "}
          <Link href="/(auth)/login" style={authStyles.link}>
            Login
          </Link>
        </Text>
      </View>
    </View>
  );
}

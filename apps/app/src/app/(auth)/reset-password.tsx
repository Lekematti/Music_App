import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";

import { apiFetch } from "@/lib/api";
import { authStyles } from "@/styles/auth";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => {
    const rawToken = params.token;
    return Array.isArray(rawToken) ? rawToken[0] : rawToken;
  }, [params.token]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (!token) {
      Alert.alert("Invalid link", "Please request a new password reset link.");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing fields", "Fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid password",
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
        }),
      });

      Alert.alert("Success", "Password reset successfully.");
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert(
        "Reset failed",
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
        <Text style={authStyles.title}>Reset Password</Text>

        <Text style={authStyles.helperText}>
          Choose a new password for your account.
        </Text>

        <Text style={authStyles.label}>New Password</Text>
        <TextInput
          placeholder="Enter new password"
          placeholderTextColor="#8a8a95"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={authStyles.input}
        />

        <Text style={authStyles.label}>Confirm Password</Text>
        <TextInput
          placeholder="Confirm new password"
          placeholderTextColor="#8a8a95"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={authStyles.input}
        />

        <Pressable
          style={({ pressed }) => [
            authStyles.button,
            pressed && authStyles.buttonPressed,
            loading && authStyles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0b0f" />
          ) : (
            <Text style={authStyles.buttonText}>Reset Password</Text>
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

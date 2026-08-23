import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";

import { clearToken, getToken, setToken } from "@/lib/auth";
import { apiFetch, setAuthHeaders } from "@/lib/api";
import { profileStyles } from "@/styles/profile";

type Song = {
  id: string;
  title: string;
  artist: string;
  averageRating?: number;
  ratings?: Array<{ score: number }>;
  createdAt?: string;
};

type MeResponse = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

type ProfileTab = "publications" | "password" | "username" | "email";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [activeTab, setActiveTab] = useState<ProfileTab>("publications");
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;

  const authHeaders = useMemo(() => {
    const token = getToken();
    return (setAuthHeaders(token ?? undefined) ?? {}) as Record<string, string>;
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = getToken();
        if (!token) {
          router.replace("/(auth)/login");
          return;
        }

        const meData = (await apiFetch("/api/auth/me", {
          headers: authHeaders,
        })) as MeResponse;

        setMe(meData);
        setUsername(meData.username ?? "");
        setEmail(meData.email ?? "");

        const mySongsData = await apiFetch("/api/songs?userId=" + meData.id);
        const normalizedSongs = Array.isArray(mySongsData)
          ? (mySongsData as Song[])
          : [];
        setSongs(normalizedSongs);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load profile";
        Alert.alert("Profile error", message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [authHeaders]);

  const avgRating = useMemo(() => {
    const totals = songs.reduce(
      (acc, song) => {
        const ratings = song.ratings ?? [];
        acc.count += ratings.length;
        acc.sum += ratings.reduce((sum, r) => sum + r.score, 0);
        return acc;
      },
      { sum: 0, count: 0 },
    );

    if (totals.count === 0) return "0.0";
    return (totals.sum / totals.count).toFixed(1);
  }, [songs]);

  async function refreshSongs(userId: string) {
    const mySongsData = await apiFetch("/api/songs?userId=" + userId);
    const normalizedSongs = Array.isArray(mySongsData)
      ? (mySongsData as Song[])
      : [];
    setSongs(normalizedSongs);
  }

  async function onSaveAccount() {
    if (!me) return;

    try {
      setSaving(true);
      const payload: Record<string, string> = {};

      if (username.trim() && username.trim() !== me.username) {
        payload.username = username.trim();
      }
      if (email.trim() && email.trim() !== me.email) {
        payload.email = email.trim().toLowerCase();
      }

      if (Object.keys(payload).length === 0) {
        Alert.alert("No changes", "Update username or email first.");
        return;
      }

      const updated = (await apiFetch("/api/auth/me", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      })) as MeResponse & { token?: string };

      setMe({
        id: updated.id,
        username: updated.username,
        email: updated.email,
        avatarUrl: updated.avatarUrl ?? null,
      });
      setUsername(updated.username ?? "");
      setEmail(updated.email ?? "");

      if (updated.token) {
        setToken(updated.token);
      }

      Alert.alert("Saved", "Profile updated successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing fields", "Fill both password fields.");
      return;
    }

    try {
      setSaving(true);
      await apiFetch("/api/auth/me/password", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Done", "Password updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to change password";
      Alert.alert("Password update failed", message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteSong(songId: string, title: string) {
    const confirmed = await confirmAction(
      "Delete song",
      `Delete "${title}"? This cannot be undone.`,
    );
    if (!confirmed || !me) return;

    try {
      await apiFetch("/api/songs/" + songId, {
        method: "DELETE",
        headers: authHeaders,
      });

      await refreshSongs(me.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete song";
      Alert.alert("Delete failed", message);
    }
  }

  async function onDeleteAccount() {
    const confirmed = await confirmAction(
      "Delete account",
      "Delete your account and all songs? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await apiFetch("/api/auth/me", {
        method: "DELETE",
        headers: authHeaders,
      });

      clearToken();
      router.replace("/(auth)/register");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      Alert.alert("Delete failed", message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={profileStyles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={profileStyles.centerText}>Loading profile...</Text>
      </View>
    );
  }

  if (!me) {
    return (
      <View style={profileStyles.center}>
        <Text style={profileStyles.centerText}>Could not load profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={profileStyles.screen}
      contentContainerStyle={profileStyles.page}
    >
      <View
        style={[profileStyles.layout, !isDesktop && profileStyles.layoutMobile]}
      >
        <View
          style={[
            profileStyles.leftSidebar,
            !isDesktop && profileStyles.fullWidth,
          ]}
        >
          <SidebarTab
            label="Publications"
            active={activeTab === "publications"}
            onPress={() => setActiveTab("publications")}
          />
          <SidebarTab
            label="Change password"
            active={activeTab === "password"}
            onPress={() => setActiveTab("password")}
          />
          <SidebarTab
            label="Change username"
            active={activeTab === "username"}
            onPress={() => setActiveTab("username")}
          />
          <SidebarTab
            label="Change email"
            active={activeTab === "email"}
            onPress={() => setActiveTab("email")}
          />

          <View style={profileStyles.sidebarDivider} />
          <Pressable
            style={profileStyles.sidebarGhostBtn}
            onPress={() => {
              clearToken();
              router.replace("/(auth)/login");
            }}
          >
            <Text style={profileStyles.sidebarGhostText}>Logout</Text>
          </Pressable>
          <Pressable
            style={[
              profileStyles.sidebarDangerBtn,
              deleting && profileStyles.disabledBtn,
            ]}
            disabled={deleting}
            onPress={() => void onDeleteAccount()}
          >
            <Text style={profileStyles.sidebarDangerText}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            profileStyles.centerPanel,
            !isDesktop && profileStyles.fullWidth,
          ]}
        >
          {activeTab === "publications" && (
            <View style={profileStyles.section}>
              <Text style={profileStyles.sectionTitle}>Publications</Text>
              {songs.length === 0 ? (
                <Text style={profileStyles.muted}>
                  You have not uploaded songs yet.
                </Text>
              ) : (
                songs.map((song) => (
                  <View key={song.id} style={profileStyles.songRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={profileStyles.songTitle} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={profileStyles.songArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                    <Pressable
                      style={profileStyles.deleteSongBtn}
                      onPress={() => void onDeleteSong(song.id, song.title)}
                    >
                      <Text style={profileStyles.deleteSongText}>Delete</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "password" && (
            <View style={profileStyles.section}>
              <Text style={profileStyles.sectionTitle}>Change Password</Text>
              <Text style={profileStyles.label}>Current password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={profileStyles.input}
                placeholder="Current password"
                placeholderTextColor="#7f8392"
              />
              <Text style={profileStyles.label}>New password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={profileStyles.input}
                placeholder="New password"
                placeholderTextColor="#7f8392"
              />
              <Pressable
                style={[
                  profileStyles.primaryBtn,
                  saving && profileStyles.disabledBtn,
                ]}
                onPress={() => void onChangePassword()}
                disabled={saving}
              >
                <Text style={profileStyles.primaryText}>
                  {saving ? "Updating..." : "Update Password"}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === "username" && (
            <View style={profileStyles.section}>
              <Text style={profileStyles.sectionTitle}>Change Username</Text>
              <Text style={profileStyles.label}>New username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={profileStyles.input}
                placeholder="Enter new username"
                placeholderTextColor="#7f8392"
              />
              <Pressable
                style={[
                  profileStyles.primaryBtn,
                  saving && profileStyles.disabledBtn,
                ]}
                onPress={() => void onSaveAccount()}
                disabled={saving}
              >
                <Text style={profileStyles.primaryText}>
                  {saving ? "Saving..." : "Update Username"}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === "email" && (
            <View style={profileStyles.section}>
              <Text style={profileStyles.sectionTitle}>Change Email</Text>
              <Text style={profileStyles.label}>New email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={profileStyles.input}
                placeholder="Enter new email"
                placeholderTextColor="#7f8392"
              />
              <Pressable
                style={[
                  profileStyles.primaryBtn,
                  saving && profileStyles.disabledBtn,
                ]}
                onPress={() => void onSaveAccount()}
                disabled={saving}
              >
                <Text style={profileStyles.primaryText}>
                  {saving ? "Saving..." : "Update Email"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View
          style={[
            profileStyles.rightSidebar,
            !isDesktop && profileStyles.fullWidth,
          ]}
        >
          <View style={profileStyles.avatarCircle}>
            <Text style={profileStyles.avatarInitial}>
              {me.username?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <Text style={profileStyles.name}>{me.username}</Text>
          <Text style={profileStyles.email}>{me.email}</Text>

          <View style={profileStyles.infoDivider} />
          <View style={profileStyles.statsRow}>
            <View style={profileStyles.statBox}>
              <Text style={profileStyles.statValue}>{songs.length}</Text>
              <Text style={profileStyles.statLabel}>PUBLICATIONS</Text>
            </View>
            <View style={profileStyles.statBox}>
              <Text style={profileStyles.statValue}>{avgRating} ★</Text>
              <Text style={profileStyles.statLabel}>RATING AVERAGE</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SidebarTab({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[profileStyles.navItem, active && profileStyles.navItemActive]}
    >
      <Text
        style={[profileStyles.navText, active && profileStyles.navTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(globalThis.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Confirm", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import { getToken } from "@/lib/auth";
import { apiFetchMultipart, setAuthHeaders } from "@/lib/api";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  webFile?: File;
};

export default function UploadScreen() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<PickedFile | null>(null);
  const [imageFile, setImageFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pickAudio() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/mpeg", "audio/mp3", "audio/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets?.[0];
    if (!file) return;

    const mimeType = file.mimeType ?? "audio/mpeg";
    if (!mimeType.startsWith("audio/")) {
      Alert.alert("Invalid file", "Please choose an MP3 audio file.");
      return;
    }

    const webFile =
      Platform.OS === "web"
        ? (file as DocumentPicker.DocumentPickerAsset & { file?: File }).file
        : undefined;

    setAudioFile({
      uri: file.uri,
      name: file.name ?? "track.mp3",
      mimeType,
      webFile,
    });
  }

  async function pickCover() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/webp", "image/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets?.[0];
    if (!file) return;

    const mimeType = file.mimeType ?? "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      Alert.alert("Invalid file", "Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    const webFile =
      Platform.OS === "web"
        ? (file as DocumentPicker.DocumentPickerAsset & { file?: File }).file
        : undefined;

    setImageFile({
      uri: file.uri,
      name: file.name ?? "cover.jpg",
      mimeType,
      webFile,
    });
  }

  async function submitUpload() {
    const token = getToken();

    if (!token) {
      Alert.alert("Login required", "Please log in before uploading.");
      router.replace("/(auth)/login");
      return;
    }

    if (!title.trim() || !artist.trim()) {
      Alert.alert("Missing fields", "Title and artist are required.");
      return;
    }

    if (!audioFile) {
      Alert.alert("Missing audio", "Please select an audio file.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("artist", artist.trim());

      if (Platform.OS === "web" && audioFile.webFile) {
        formData.append("audioFile", audioFile.webFile, audioFile.name);
      } else {
        formData.append("audioFile", {
          uri: audioFile.uri,
          name: audioFile.name,
          type: audioFile.mimeType,
        } as unknown as Blob);
      }

      if (imageFile) {
        if (Platform.OS === "web" && imageFile.webFile) {
          formData.append("imageFile", imageFile.webFile, imageFile.name);
        } else {
          formData.append("imageFile", {
            uri: imageFile.uri,
            name: imageFile.name,
            type: imageFile.mimeType,
          } as unknown as Blob);
        }
      }

      await apiFetchMultipart("/api/uploads", formData, {
        method: "POST",
        headers: setAuthHeaders(token),
      });

      Alert.alert("Success", "Song uploaded successfully.");
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setImageFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      Alert.alert("Upload failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Upload a Song</Text>
        <Text style={styles.subtitle}>Add a new track.</Text>

        <Text style={styles.label}>Song Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Example: My New Song"
          placeholderTextColor="#808392"
          style={styles.input}
        />

        <Text style={styles.label}>Artist</Text>
        <TextInput
          value={artist}
          onChangeText={setArtist}
          placeholder="Example: The Band"
          placeholderTextColor="#808392"
          style={styles.input}
        />

        <Text style={styles.label}>Audio File (MP3)</Text>
        <Pressable style={styles.pickerBtn} onPress={() => void pickAudio()}>
          <Text style={styles.pickerBtnText}>
            {audioFile ? audioFile.name : "Choose audio file"}
          </Text>
        </Pressable>

        <Text style={styles.label}>Cover Image (optional)</Text>
        <Pressable style={styles.pickerBtn} onPress={() => void pickCover()}>
          <Text style={styles.pickerBtnText}>
            {imageFile ? imageFile.name : "Choose cover image"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          disabled={submitting}
          onPress={() => void submitUpload()}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Upload</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: "#15161c",
    borderWidth: 1,
    borderColor: "#24252d",
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#a6a9b6",
    marginBottom: 6,
  },
  label: {
    color: "#d4d7e2",
    fontSize: 13,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#101218",
    borderWidth: 1,
    borderColor: "#2a2d38",
    borderRadius: 12,
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerBtn: {
    backgroundColor: "#101218",
    borderWidth: 1,
    borderColor: "#2a2d38",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerBtnText: {
    color: "#d8dbe8",
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#2a6cff",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    minHeight: 44,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});

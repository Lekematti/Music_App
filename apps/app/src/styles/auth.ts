import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoWrap: {
    marginBottom: 24,
    alignItems: "center",
  },
  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#15161c",
    borderRadius: 20,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: "#24252d",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  helperText: {
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  label: {
    color: "#d7d7df",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#0f1014",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2b33",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  link: {
    color: "#8cbcff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    color: "#b5b5c0",
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#0b0b0f",
    fontSize: 16,
    fontWeight: "700",
  },
});
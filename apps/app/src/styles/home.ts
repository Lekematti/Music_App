import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  brand: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "700",
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#15161c",
    borderWidth: 1,
    borderColor: "#24252d",
  },
  logoutText: {
    color: "#8cbcff",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingWrap: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#b5b5c0",
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: "#15161c",
    borderWidth: 1,
    borderColor: "#3b2020",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  errorTitle: {
    color: "#ffb4b4",
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    color: "#d0d0d8",
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  sectionBody: {
    gap: 10,
  },
  songCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#15161c",
    borderWidth: 1,
    borderColor: "#24252d",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  songInfo: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  songTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  songArtist: {
    color: "#b5b5c0",
    fontSize: 14,
  },
  songMeta: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  songMetaText: {
    color: "#8cbcff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#101218",
    borderWidth: 1,
    borderColor: "#20222c",
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: "#8f90a0",
    fontSize: 14,
  },
});
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
    marginBottom: 32,
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
    paddingRight: 0,
    gap: 4,
  },
  songTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  songArtist: {
    color: "#b5b5c0",
    fontSize: 13,
  },
  songCover: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#23242d",
    marginRight: 12,
  },
  songCoverFallback: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#23242d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  songCoverIcon: {
    color: "#8cbcff",
    fontSize: 24,
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
  compactSection: {
    marginTop: 4,
  },
  compactSongCard: {
    width: 190,
    flexDirection: "column",
    alignItems: "stretch",
    padding: 10,
    borderRadius: 14,
  },
  compactSongCover: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    marginRight: 0,
    marginBottom: 10,
  },
  cardRow: {
    gap: 12,
    paddingRight: 20,
  },
  featuredSongCard: {
    width: 220,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 12,
    borderRadius: 16,
  },

  featuredSongCover: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    marginRight: 0,
    marginBottom: 12,
  },
  homeColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  homeColumnsMobile: {
    flexDirection: "column",
  },
  discoveryColumn: {
    flex: 1,
    minWidth: 0,
    gap: 32,
  },
  uploadsColumn: {
    width: 320,
  },
  uploadsColumnMobile: {
    width: "100%",
  },
  homeLogo: {
    width: 72,
    height: 72,
    alignSelf: "center",
    marginBottom: 8,
  },
});

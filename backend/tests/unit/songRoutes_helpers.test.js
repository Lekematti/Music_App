import { describe, it, expect } from "vitest";

describe("songRoutes helpers", () => {
  const routeModule = require("../../routes/songRoutes");

  it("extractStorageReference returns null for empty or non-string", () => {
    expect(routeModule.extractStorageReference(null)).toBeNull();
    expect(routeModule.extractStorageReference("")).toBeNull();
  });

  it("extractStorageReference parses stored paths", () => {
    const r = routeModule.extractStorageReference("path/to/file.mp3", "songs");
    expect(r).toEqual({ bucket: "songs", path: "path/to/file.mp3" });
  });

  it("extractStorageReference parses public supabase URLs into bucket and path", () => {
    const publicUrl =
      "https://example.supabase.co/storage/v1/object/public/songs/path/to/track.mp3";
    const r = routeModule.extractStorageReference(publicUrl);
    expect(r).toEqual({ bucket: "songs", path: "path/to/track.mp3" });
  });

  it("extractStorageReference returns null for incomplete public URL", () => {
    const publicNoPath =
      "https://example.supabase.co/storage/v1/object/public/songs";
    expect(routeModule.extractStorageReference(publicNoPath)).toBeNull();
  });

  it("toSignedPlaybackUrl returns proxy for local stored paths", async () => {
    const proxied = await routeModule.toSignedPlaybackUrl(
      "local/path.mp3",
      "songs",
    );
    expect(proxied.includes("/api/media")).toBe(true);
  });
});

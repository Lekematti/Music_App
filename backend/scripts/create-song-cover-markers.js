require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient');
const songRoutes = require('../routes/songRoutes');

const BUCKET_SONGS = 'songs';
const BUCKET_COVERS = 'covers';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase env vars missing');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

const uploadMarker = async (bucket, username, payload) => {
  const key = `${username}/.info`;
    try {
      let uploadKey;
      let body;
      let contentType;
      if (bucket === 'songs') {
        uploadKey = `${username}/.info.mp3`;
        contentType = 'audio/mpeg';
        body = Buffer.from([0, 1, 2, 3, 4]);
      } else {
        uploadKey = `${username}/.info.png`;
        contentType = 'image/png';
        body = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9s4hZQAAAABJRU5ErkJggg==', 'base64');
      }

      const { data, error } = await client.storage.from(bucket).upload(uploadKey, body, { contentType, upsert: true });
      if (error) {
        console.error('Failed to write marker', bucket, uploadKey, error?.message || error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to write marker', bucket, key, err?.message || err);
      return false;
    }
};

const run = async ({ dryRun = true } = {}) => {
  console.log(`Creating song/cover markers (dryRun=${dryRun})`);
  const songs = await prisma.song.findMany({ include: { user: true } });
  let count = 0;

  for (const s of songs) {
    const username = s.user?.username;
    if (!username) continue;

    const audioPayload = { userId: s.userId, songId: s.id, audio: s.url };
    console.log('Song marker', username, s.id, s.url);
    if (!dryRun) await uploadMarker(BUCKET_SONGS, username, audioPayload);
    count++;

    // Try to resolve cover path if present
    if (s.imageUrl) {
      let coverPath = null;
      if (s.imageUrl.startsWith('http')) {
        const ref = songRoutes.extractStorageReference(s.imageUrl, 'covers');
        if (ref) coverPath = ref.path;
      } else {
        coverPath = s.imageUrl;
      }

      if (coverPath) {
        console.log('Cover marker', username, coverPath);
        if (!dryRun) await uploadMarker(BUCKET_COVERS, username, { userId: s.userId, songId: s.id, cover: coverPath });
      }
    }
  }

  console.log(`Processed ${count} songs`);
  if (dryRun) console.log('Dry-run complete. Re-run with --run to write markers.');
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const dry = !args.includes('--run');
  run({ dryRun: dry }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(2); });
}

module.exports = { run };

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient');

const BUCKET = 'avatars';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase env vars missing');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

const run = async ({ dryRun = true } = {}) => {
  console.log(`Creating avatar markers for users (dryRun=${dryRun})`);
  const users = await prisma.user.findMany({ select: { id: true, username: true, avatarUrl: true } });

  let count = 0;
  for (const u of users) {
    if (!u.avatarUrl || typeof u.avatarUrl !== 'string') continue;
    // skip external URLs
    if (u.avatarUrl.startsWith('http')) continue;

    const key = `${u.username}/.info`;
    const payload = JSON.stringify({ id: u.id, avatar: u.avatarUrl });
    console.log('Marker', key, '->', u.avatarUrl);
    count++;
    if (!dryRun) {
      try {
        await client.storage.from(BUCKET).upload(key, Buffer.from(payload), { contentType: 'text/plain', upsert: true });
      } catch (err) {
        console.error('Failed to write marker for', u.username, err?.message || err);
      }
    }
  }

  console.log(`Processed ${count} users`);
  if (dryRun) console.log('Dry-run complete. Re-run with --run to write markers.');
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const dry = !args.includes('--run');
  run({ dryRun: dry }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(2); });
}

module.exports = { run };

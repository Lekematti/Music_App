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
  console.log(`Scanning ${BUCKET} for orphaned avatar folders (dryRun=${dryRun})`);

  // List root entries
  const { data: rootList, error: rootErr } = await client.storage.from(BUCKET).list('', { limit: 1000 });
  if (rootErr) {
    console.error('Failed to list bucket:', rootErr.message || rootErr);
    process.exit(2);
  }

  const orphanCandidates = [];

  for (const item of rootList || []) {
    const prefix = item.name;
    // Check DB for user with id OR username equal to prefix
    const userById = await prisma.user.findUnique({ where: { id: prefix } }).catch(() => null);
    const userByUsername = await prisma.user.findFirst({ where: { username: prefix } }).catch(() => null);

    if (!userById && !userByUsername) {
      // collect objects under this prefix
      const { data: objects } = await client.storage.from(BUCKET).list(prefix, { limit: 1000 });
      const names = (objects || []).map(o => `${prefix}/${o.name}`);
      orphanCandidates.push({ prefix, objects: names });
    }
  }

  if (orphanCandidates.length === 0) {
    console.log('No orphaned avatar folders found');
    return;
  }

  console.log('Found orphaned avatar folders:');
  for (const c of orphanCandidates) {
    console.log(`- ${c.prefix} -> ${c.objects.length} objects`);
    for (const o of c.objects) console.log('   ', o);
  }

  if (!dryRun) {
    console.log('\nDeleting orphaned objects...');
    for (const c of orphanCandidates) {
      try {
        await client.storage.from(BUCKET).remove(c.objects).catch(() => {});
        console.log('Deleted objects for', c.prefix);
      } catch (err) {
        console.error('Failed to delete objects for', c.prefix, err?.message || err);
      }
    }
    console.log('Deletion complete');
  } else {
    console.log('\nDry-run complete. Run with --run to delete these objects.');
  }
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const dry = !args.includes('--run');
  run({ dryRun: dry }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(2); });
}

module.exports = { run };

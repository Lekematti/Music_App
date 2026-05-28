require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../prisma/prismaClient');

const BUCKET = 'avatars';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

const run = async ({ dryRun = true, deleteOld = false } = {}) => {
    console.log(`Running avatar path migration (dryRun=${dryRun}, deleteOld=${deleteOld})`);

    const users = await prisma.user.findMany({ where: { avatarUrl: { not: null } }, select: { id: true, username: true, avatarUrl: true } });

    for (const u of users) {
        const { id, username, avatarUrl } = u;
        if (!avatarUrl || avatarUrl.startsWith('http')) continue;

        const parts = avatarUrl.split('/').filter(Boolean);
        if (parts.length < 2) continue;

        const first = parts[0];
        const remainder = parts.slice(1).join('/');

        // If first segment equals username, propose moving to id
        if (first === username) {
            const oldPath = avatarUrl;
            const newPath = `${id}/${remainder}`;

            console.log(`User ${username} (${id}): will migrate ${oldPath} -> ${newPath}`);

            if (!dryRun) {
                try {
                    const { data: downloadData, error: dlErr } = await client.storage.from(BUCKET).download(oldPath);
                    if (dlErr) throw dlErr;

                    const arrayBuffer = await downloadData.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    const { error: upErr } = await client.storage.from(BUCKET).upload(newPath, buffer, { upsert: false });
                    if (upErr) throw upErr;

                    // Update DB
                    await prisma.user.update({ where: { id }, data: { avatarUrl: newPath } });

                    if (deleteOld) {
                        await client.storage.from(BUCKET).remove([oldPath]).catch(() => {});
                    }
                } catch (err) {
                    console.error('Migration failed for user', id, err?.message || err);
                }
            }
        }
    }

    console.log('Migration complete');
};

if (require.main === module) {
    const args = process.argv.slice(2);
    const dry = !args.includes('--run');
    const del = args.includes('--delete-old');
    run({ dryRun: dry, deleteOld: del }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(2); });
}

module.exports = { run };

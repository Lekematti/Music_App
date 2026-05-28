require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tests = [
    { bucket: 'songs', ct: 'application/octet-stream' },
    { bucket: 'songs', ct: 'image/png' },
    { bucket: 'covers', ct: 'image/png' },
    { bucket: 'covers', ct: 'application/octet-stream' }
  ];

  for (const t of tests) {
    try {
      const key = `marker-test-${Math.random().toString(36).slice(2,8)}/.info`;
      const { data, error } = await c.storage.from(t.bucket).upload(key, Buffer.from('x'), { contentType: t.ct, upsert: true });
      console.log('TRY', t.bucket, t.ct, '->', error ? error.message : 'OK');
      if (!error) {
        const dl = await c.storage.from(t.bucket).download(key);
        if (dl.error) console.log('DL ERR', dl.error.message);
        else console.log('DL OK', Buffer.from(await dl.data.arrayBuffer()).toString());
      }
    } catch (e) {
      console.error('ERR', e.message || e);
    }
  }
  process.exit(0);
})();

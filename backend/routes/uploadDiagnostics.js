const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let supabase = null;
const getSupabase = () => {
  if (supabase) return supabase;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (e) {
      supabase = null;
      console.error('Failed to create Supabase client:', e && e.message ? e.message : e);
    }
  }
  return supabase;
};

// Allow tests to inject a mocked supabase client
router.setSupabaseClient = (client) => {
  supabase = client;
};

router.get('/', async (req, res) => {
  try {
    const client = getSupabase();
    const config = {
      supabaseUrlPresent: !!supabaseUrl,
      supabaseServiceKeyPresent: !!supabaseServiceKey,
      supabaseClientCreated: !!client,
    };

    if (!client) {
      return res.json({ ok: false, message: 'Supabase storage is not configured', config });
    }

    // Try to list buckets as a lightweight permission check
    try {
      const { data: buckets, error } = await client.storage.listBuckets();
      if (error) {
        return res.json({ ok: false, message: 'Supabase client created but listing buckets failed', config, error: error.message });
      }
      const bucketNames = Array.isArray(buckets) ? buckets.map(b => b.name) : [];
      return res.json({ ok: true, message: 'Supabase storage client available', config, buckets: bucketNames });
    } catch (e) {
      return res.json({ ok: false, message: 'Supabase client created but operation failed', config, error: e.message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;

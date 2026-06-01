const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');


let supabase = null;

const getSupabase = () => {
    if (supabase) return supabase;
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
    if (url && key) {
        try {
            supabase = createClient(url, key);
        } catch (e) {
            supabase = null;
            console.error('Failed to create Supabase client:', e?.message || e);
        }
    }
    return supabase;
};


router.setSupabaseClient = (client) => {
    supabase = client;
};

router.get('/', async (req, res) => {
    try {
        const client = getSupabase();
        const config = {
            supabaseUrlPresent: !!process.env.SUPABASE_URL,
            supabaseServiceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            supabaseClientCreated: !!client,
        };

        if (!client) {
            return res.json({ ok: false, message: 'Supabase storage is not configured', config });
        }

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
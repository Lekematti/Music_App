const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let supabase = null;

const getSupabase = () => {
    if (supabase) return supabase;
    if (supabaseUrl && supabaseServiceKey) {
        // If the URL is the placeholder example (commonly present in env during CI/dev), avoid creating a real client.
        if (supabaseUrl.includes('example.supabase.co')) return null;
        try {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
        } catch (e) {
            // if client creation fails, leave supabase null and let routes report not-configured
            supabase = null;
            console.error('Failed to create Supabase client:', e?.message || e);
        }
    }
    return supabase;
};

router.setSupabaseClient = (client) => {
    supabase = client;
};

const setContentType = (bucket, objectPath) => {
    if (bucket === 'songs') {
        return 'audio/mpeg';
    }
    if (bucket === 'covers') {
        const ext = objectPath.split('.').pop()?.toLowerCase();
        const typeMap = { png: 'image/png', webp: 'image/webp' };
        return typeMap[ext] || 'image/jpeg';
    }
    return 'application/octet-stream';
};

const handleRangeRequest = (buffer, totalSize, rangeHeader) => {
    if (!rangeHeader) return null;
    
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) return null;

    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : totalSize - 1;
    const safeEnd = Math.min(end, totalSize - 1);
    const chunk = buffer.subarray(start, safeEnd + 1);

    return { start, safeEnd, chunk };
};

router.get('/', async (req, res) => {
    try {
        const client = getSupabase();
        if (!client) {
            return res.status(500).json({ message: 'Supabase storage is not configured' });
        }

        const bucket = typeof req.query.bucket === 'string' ? req.query.bucket : '';
        const objectPath = typeof req.query.path === 'string' ? req.query.path : '';

        if (!bucket || !objectPath) {
            return res.status(400).json({ message: 'bucket and path are required' });
        }

        const { data, error } = await client.storage.from(bucket).download(objectPath);

        if (error || !data) {
            return res.status(404).json({ message: error?.message || 'File not found' });
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const totalSize = buffer.length;
        const rangeHeader = req.get('range') || req.headers.range || '';

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-store');
        res.type(setContentType(bucket, objectPath));

        const rangeResult = handleRangeRequest(buffer, totalSize, rangeHeader);
        if (rangeResult) {
            res.status(206);
            res.setHeader('Content-Range', `bytes ${rangeResult.start}-${rangeResult.safeEnd}/${totalSize}`);
            res.setHeader('Content-Length', rangeResult.chunk.length);
            return res.send(rangeResult.chunk);
        }

        res.setHeader('Content-Length', totalSize);
        return res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while streaming media' });
    }
});

module.exports = router;

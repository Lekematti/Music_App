const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

router.setSupabaseClient = (client) => {
    supabase = client;
};

router.get('/', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ message: 'Supabase storage is not configured' });
        }

        const bucket = typeof req.query.bucket === 'string' ? req.query.bucket : '';
        const objectPath = typeof req.query.path === 'string' ? req.query.path : '';

        if (!bucket || !objectPath) {
            return res.status(400).json({ message: 'bucket and path are required' });
        }

        const { data, error } = await supabase.storage.from(bucket).download(objectPath);

        if (error || !data) {
            return res.status(404).json({ message: error?.message || 'File not found' });
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const totalSize = buffer.length;
        const rangeHeader = req.get('range') || req.headers.range || '';

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-store');

        if (bucket === 'songs') {
            res.type('audio/mpeg');
        } else if (bucket === 'covers') {
            const ext = objectPath.split('.').pop()?.toLowerCase();
            if (ext === 'png') res.type('image/png');
            else if (ext === 'webp') res.type('image/webp');
            else res.type('image/jpeg');
        } else {
            res.type('application/octet-stream');
        }

        if (rangeHeader) {
            const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());

            if (match) {
                const start = Number.parseInt(match[1], 10);
                const end = match[2] ? Number.parseInt(match[2], 10) : totalSize - 1;
                const safeEnd = Math.min(end, totalSize - 1);
                const chunk = buffer.subarray(start, safeEnd + 1);

                res.status(206);
                res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${totalSize}`);
                res.setHeader('Content-Length', chunk.length);
                return res.send(chunk);
            }
        }

        res.setHeader('Content-Length', totalSize);
        return res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while streaming media' });
    }
});

module.exports = router;

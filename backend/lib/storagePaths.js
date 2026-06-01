const crypto = require('node:crypto');

const normalizeStorageSegment = (rawValue, fallback = 'user') => {
    const safe = String(rawValue || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (safe) {
        return safe;
    }

    const fallbackSafe = String(fallback || 'user')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    return fallbackSafe || 'user';
};

const buildUserStoragePath = (username, category, ext, fallback = 'user') => {
    const folder = normalizeStorageSegment(username, fallback);
    const subfolder = normalizeStorageSegment(category, 'files');
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    return `${folder}/${subfolder}/${Date.now()}-${uniqueSuffix}.${ext}`;
};

module.exports = {
    buildUserStoragePath,
    normalizeStorageSegment,
};

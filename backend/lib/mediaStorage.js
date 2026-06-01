const mediaProxyUrl = (bucket, objectPath) => `/api/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}`;

const extractStorageReference = (storedValue, defaultBucket = 'songs') => {
    if (typeof storedValue !== 'string' || !storedValue.trim()) {
        return null;
    }

    if (!storedValue.startsWith('http')) {
        return { bucket: defaultBucket, path: storedValue };
    }

    try {
        const parsedUrl = new URL(storedValue);

        if (parsedUrl.pathname === '/api/media') {
            const bucket = parsedUrl.searchParams.get('bucket') || defaultBucket;
            const path = parsedUrl.searchParams.get('path');

            if (path) {
                return { bucket, path };
            }
        }

        const publicMarker = '/storage/v1/object/public/';
        const markerIndex = parsedUrl.pathname.indexOf(publicMarker);

        if (markerIndex !== -1) {
            const publicPath = parsedUrl.pathname.slice(markerIndex + publicMarker.length);
            const segments = publicPath.split('/').filter(Boolean);

            if (segments.length >= 2) {
                return {
                    bucket: segments[0],
                    path: segments.slice(1).join('/'),
                };
            }
        }
    } catch (error) {
        console.error('Failed to extract storage reference:', error);
    }

    return null;
};

const toSignedPlaybackUrl = async (storedUrl, defaultBucket = 'songs') => {
    if (!storedUrl) return storedUrl;

    if (!storedUrl.startsWith('http')) {
        return mediaProxyUrl(defaultBucket, storedUrl);
    }

    try {
        const parsedUrl = new URL(storedUrl);
        const publicMarker = '/storage/v1/object/public/';
        const markerIndex = parsedUrl.pathname.indexOf(publicMarker);

        if (markerIndex === -1) {
            return storedUrl;
        }

        const publicPath = parsedUrl.pathname.slice(markerIndex + publicMarker.length);
        const segments = publicPath.split('/').filter(Boolean);
        if (segments.length < 2) {
            return storedUrl;
        }

        const bucket = segments[0];
        const objectPath = segments.slice(1).join('/');
        return mediaProxyUrl(bucket, objectPath);
    } catch (error) {
        console.error('Failed to create signed playback URL:', error);
    }

    return storedUrl;
};

const attachPlayableUrl = async (song) => ({
    ...song,
    url: await toSignedPlaybackUrl(song.url, 'songs'),
    imageUrl: await toSignedPlaybackUrl(song.imageUrl, 'covers'),
});

const attachPlayableUrls = async (songs) => Promise.all(songs.map(attachPlayableUrl));

const removeStorageObjectIfPresent = async (client, ref) => {
    if (!client?.storage || !ref?.bucket || !ref?.path) {
        return;
    }

    await client.storage.from(ref.bucket).remove([ref.path]).catch(() => {});
};

module.exports = {
    attachPlayableUrl,
    attachPlayableUrls,
    extractStorageReference,
    mediaProxyUrl,
    removeStorageObjectIfPresent,
    toSignedPlaybackUrl,
};

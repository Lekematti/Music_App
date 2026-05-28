const songMap = new Map();

const playSongOnGlobalPlayer = async (globalPlayer, song) => {
    if (!globalPlayer || !song?.url) {
        return;
    }

    if (song.title) globalPlayer.setAttribute('title', song.title);
    if (song.artist) globalPlayer.setAttribute('artist', song.artist);
    if (song.id) globalPlayer.setAttribute('song-id', song.id);

    const currentSrc = globalPlayer.getAttribute('src') || '';
    const isSameSource = currentSrc === song.url;
    const readyPromise = isSameSource
        ? Promise.resolve(true)
        : new Promise((resolve) => {
            const timeoutId = globalThis.setTimeout(() => resolve(false), 4000);
            const handleReady = (event) => {
                if (!event.detail?.src || event.detail.src === song.url) {
                    globalThis.clearTimeout(timeoutId);
                    resolve(true);
                }
            };

            globalPlayer.addEventListener('player-source-ready', handleReady, { once: true });
        });

    globalPlayer.setAttribute('src', song.url);

    if (await readyPromise) {
        globalPlayer.querySelector('.player-toggle')?.click();
    }
};

const createSongElement = (tagName, song) => {
    const element = document.createElement(tagName);

    // prefer dataset over setAttribute
    element.dataset.songId = String(song.id);
    element.dataset.title = song.title;
    element.dataset.artist = song.artist;
    element.setAttribute('song-id', String(song.id));
    element.setAttribute('title', song.title);
    element.setAttribute('artist', song.artist);
    
    // Compute average rating either from injected property or raw ratings array
    const ratingsAverage = song.ratings?.length ? song.ratings.reduce((a, r) => a + r.score, 0) / song.ratings.length : 0;
    const avgScore = song.averageRating == null ? ratingsAverage : song.averageRating;
    element.setAttribute('score', avgScore.toFixed(1));
    
    // keep native tooltip
    element.title = song.title;

    if (song.imageUrl) {
        element.dataset.image = song.imageUrl;
        element.setAttribute('image', song.imageUrl);
    }

    // store playable url so the UI can quickly access it
    if (song.url) {
        // use string keys when we store data that's exposed via dataset
        songMap.set(String(song.id), song);
        // expose as data attribute so devtools can inspect
        element.dataset.audioSrc = song.url;
    }

    // clicking the custom element should play the song without navigating
    element.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // read id from the element dataset (always a string)
        const songId = ev.currentTarget.dataset.songId || String(song.id);
        let toPlay = songMap.get(songId) || song;

        if (!toPlay?.url) {
            // try to fetch fresh data for this song id
            try {
                const res = await fetch('/api/songs');
                if (res.ok) {
                    const list = await res.json();
                    const found = list.find(s => String(s.id) === songId);
                    if (found) {
                        songMap.set(String(found.id), found);
                        toPlay = found;
                    }
                }
            } catch (e) {
                console.error('Failed to fetch song for playback', e);
            }
        }

        const globalPlayer = document.getElementById('global-player');
        if (!globalPlayer || !toPlay) return;

        await playSongOnGlobalPlayer(globalPlayer, toPlay);
    });

    return element;
};

const renderSongs = (container, songs, tagName, emptyMessage) => {
    container.innerHTML = '';

    if (songs.length === 0) {
        container.innerHTML = emptyMessage;
        return;
    }

    songs.forEach(song => {
        container.appendChild(createSongElement(tagName, song));
    });
};

const getCurrentUserId = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return null;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || null;
};

const loadNewUploads = async (newUploadsList) => {
    try {
        const response = await fetch('/api/songs');

        if (!response.ok) {
            console.error('Failed to fetch new uploads');
            newUploadsList.innerHTML = '<p style="color: red;">Failed to load songs.</p>';
            return;
        }

        const newestSongs = (await response.json()).slice(0, 5);
        renderSongs(newUploadsList, newestSongs, 'music-list-item', '<p style="color: #888;">No songs uploaded yet.</p>');
    } catch (error) {
        console.error('Error fetching songs:', error);
        newUploadsList.innerHTML = '<p style="color: red;">Cannot connect to the server.</p>';
    }
};

const loadTopSongs = async (top10List) => {
    try {
        const topResponse = await fetch('/api/songs/top/rated?limit=10');

        if (!topResponse.ok) {
            return;
        }

        const topSongs = await topResponse.json();
        renderSongs(top10List, topSongs, 'music-card', '<p style="color: #888;">No songs available yet.</p>');
    } catch (error) {
        console.error('Error fetching top songs:', error);
        top10List.innerHTML = '<p style="color: red;">Cannot connect to the server.</p>';
    }
};

const loadPastUploads = async (pastUploadsList) => {
    try {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
            pastUploadsList.innerHTML = '<p style="color: #888; padding-top: 10px;">Login to see your uploads.</p>';
            return;
        }

        const uploadsResponse = await fetch(`/api/songs?userId=${currentUserId}`);

        if (!uploadsResponse.ok) {
            return;
        }

        const recentUploads = (await uploadsResponse.json()).slice(0, 5);
        renderSongs(pastUploadsList, recentUploads, 'music-list-item', '<p style="color: #888; padding-top: 10px;">You haven\'t uploaded any music yet.</p>');
    } catch (error) {
        console.error('Error fetching past uploads:', error);
        pastUploadsList.innerHTML = '<p style="color: red;">Failed to load user uploads.</p>';
    }
};

const initHome = async () => {
    const newUploadsList = document.getElementById('new-uploads-list');
    const top10List = document.getElementById('top10-widget');
    const pastUploadsList = document.getElementById('past-uploads-widget');

    if (!newUploadsList && !top10List && !pastUploadsList) {
        return;
    }

    if (newUploadsList) {
        await loadNewUploads(newUploadsList);
    }

    if (top10List) {
        await loadTopSongs(top10List);
    }

    if (pastUploadsList) {
        await loadPastUploads(pastUploadsList);
    }

    // Wire play behavior: clicking a song element will load it into global player
    const globalPlayer = document.getElementById('global-player');

    const attachPlayHandler = (container) => {
        if (!container) return;

        container.addEventListener('click', async (ev) => {
            const el = ev.target?.closest('[song-id]');
            if (!el) return;

            // allow normal navigation with modifier keys
            if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;

            // Notice we intentionally DO NOT prevent default if they clicked the rating stars or specific elements
            if (ev.target?.closest('.music-card-rating')) return;

            ev.preventDefault();

            const songId = el.getAttribute('song-id');
            const song = songMap.get(songId);

            if (!song) {
                // fallback: fetch song by id
                try {
                    const res = await fetch(`/api/songs`);
                    if (res.ok) {
                        const list = await res.json();
                        const found = list.find(s => s.id === songId);
                        if (found) songMap.set(songId, found);
                    }
                } catch (e) {
                    console.error('Failed to fetch song for playback', e);
                }
            }

            const toPlay = songMap.get(songId);
            if (!toPlay || !globalPlayer) return;

            await playSongOnGlobalPlayer(globalPlayer, toPlay);
        });
    };

    attachPlayHandler(newUploadsList);
    attachPlayHandler(top10List);
    attachPlayHandler(pastUploadsList);
};

document.addEventListener('DOMContentLoaded', initHome);
document.addEventListener('router:contentLoaded', initHome);

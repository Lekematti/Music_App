const loadSongById = async (songId) => {
    if (!songId) {
        return { title: 'Unknown Song', artist: 'No artist', url: '' };
    }

    try {
        const response = await fetch(`/api/songs/${songId}`);
        if (!response.ok) {
            console.error('Failed to fetch song details');
            return { title: 'Song not found', artist: 'Unknown', url: '' };
        }

        const song = await response.json();
        console.log('Loaded song:', song);
        return song;
    } catch (error) {
        console.error('Error fetching song:', error);
        return { title: 'Error loading song', artist: 'Unknown', url: '' };
    }
};

const getPersistentPlayerSong = () => {
    const player = document.querySelector('audio-player-component#global-player') || document.querySelector('audio-player-component');

    if (!player) {
        return null;
    }

    const title = player.getAttribute('title') || '';
    const artist = player.getAttribute('artist') || '';
    const url = player.getAttribute('src') || '';
    const id = player.getAttribute('song-id') || '';
    const imageUrl = player.getAttribute('image') || '';

    if (!title && !artist && !url) {
        return null;
    }

    return { id, title, artist, url, imageUrl };
};

const isPlaceholderSong = (song) => {
    if (!song) {
        return true;
    }

    return song.title === 'Song not found' || song.title === 'Error loading song';
};

const updateSongDetails = (song) => {
    const titleEl = document.getElementById('song-title');
    const artistEl = document.getElementById('song-artist');

    if (titleEl) {
        titleEl.textContent = song.title;
    }

    if (artistEl) {
        artistEl.textContent = song.artist;
    }
};

const updateSongCover = (song) => {
    const card = document.querySelector('section.auth-card');
    if (!card) {
        return;
    }

    const placeholder = card.querySelector('div');
    if (song.imageUrl) {
        const img = document.createElement('img');
        img.className = 'card-cover';
        img.alt = 'cover';
        img.loading = 'lazy';
        img.src = song.imageUrl;
        if (placeholder) placeholder.replaceWith(img);
        return;
    }

    if (placeholder) {
        placeholder.innerHTML = '🎵';
    }
};

let lastInitializedSongUrl = '';

const syncPersistentPlayer = (song) => {
    const playerComponent = document.querySelector('audio-player-component');
    if (!playerComponent || !song.url) {
        return;
    }

    if (song.title) playerComponent.setAttribute('title', song.title);
    if (song.artist) playerComponent.setAttribute('artist', song.artist);
    if (song.id) playerComponent.setAttribute('song-id', song.id);
    playerComponent.setAttribute('src', song.url);
};

const initializeSongPage = async () => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const songId = urlParams.get('id');
    const fetchedSong = await loadSongById(songId);
    const playerSong = getPersistentPlayerSong();
    const song = isPlaceholderSong(fetchedSong) && playerSong
        ? {
            ...fetchedSong,
            ...playerSong,
        }
        : {
            ...playerSong,
            ...fetchedSong,
        };

    updateSongDetails(song);
    updateSongCover(song);
    syncPersistentPlayer(song);
};

const runSongPageInitialization = () => {
    if (!document.getElementById('song-title')) {
        return;
    }

    if (globalThis.location.href === lastInitializedSongUrl) {
        return;
    }

    lastInitializedSongUrl = globalThis.location.href;

    initializeSongPage();
};

document.addEventListener('DOMContentLoaded', runSongPageInitialization);
document.addEventListener('router:contentLoaded', runSongPageInitialization);

if (document.readyState !== 'loading') {
    runSongPageInitialization();
}

// Function to navigate to the song page from other files
function openSong(id) {
    globalThis.location.href = `/pages/song.html?id=${id}`;
}

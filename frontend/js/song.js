document.addEventListener("DOMContentLoaded", async () => {
    // Get song ID from URL parameters (?id=1)
    const urlParams = new URLSearchParams(globalThis.location.search);
    const songId = urlParams.get('id');

    let song = { title: 'Unknown Song', artist: 'No artist', url: '' };
    let currentUser = null;

    if (songId) {
        try {
            const response = await fetch(`/api/songs/${songId}`);
            if (response.ok) {
                song = await response.json();
                console.log('Loaded song:', song);
            } else {
                console.error('Failed to fetch song details');
                song = { title: 'Song not found', artist: 'Unknown', url: '' };
            }
        } catch (error) {
            console.error('Error fetching song:', error);
            song = { title: 'Error loading song', artist: 'Unknown', url: '' };
        }
    }

    const token = localStorage.getItem('token');
    if (token) {
        try {
            const meResponse = await fetch('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (meResponse.ok) {
                currentUser = await meResponse.json();
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }

    // Update UI
    document.getElementById('song-title').textContent = song.title;
    document.getElementById('song-artist').textContent = song.artist;

    // Replace the placeholder note icon with the song cover on the card (if available)
    try {
        const card = document.querySelector('section.auth-card');
        if (card) {
            const placeholder = card.querySelector('div');
            if (song.imageUrl) {
                const img = document.createElement('img');
                img.className = 'card-cover';
                img.alt = 'cover';
                img.loading = 'lazy';
                img.src = song.imageUrl;
                if (placeholder) placeholder.replaceWith(img);
            } else if (placeholder) {
                placeholder.innerHTML = '🎵';
            }
        }
    } catch (e) { /* ignore DOM errors */ }

    // Play button logic
    const playerComponent = document.querySelector('audio-player-component');
    if (playerComponent && song.url) {
        playerComponent.setAttribute('src', song.url);
    }
});

// Function to navigate to the song page from other files
function openSong(id) {
    globalThis.location.href = `/frontend/pages/song.html?id=${id}`;
}

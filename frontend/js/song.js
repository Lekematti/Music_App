document.addEventListener("DOMContentLoaded", async () => {
    // Get song ID from URL parameters (?id=1)
    const urlParams = new URLSearchParams(globalThis.location.search);
    const songId = urlParams.get('id');

    let song = { title: 'Unknown Song', artist: 'No artist', url: '' };

    if (songId) {
        try {
            const response = await fetch(`/api/songs/${songId}`);
            if (response.ok) {
                song = await response.json();
            } else {
                console.error('Failed to fetch song details');
                song = { title: 'Song not found', artist: 'Unknown', url: '' };
            }
        } catch (error) {
            console.error('Error fetching song:', error);
            song = { title: 'Error loading song', artist: 'Unknown', url: '' };
        }
    }

    // Update UI
    document.getElementById('song-title').textContent = song.title;
    document.getElementById('song-artist').textContent = song.artist;

    // Play button logic
    const playerComponent = document.querySelector('audio-player-component');
    if (playerComponent) {
        const playBtn = playerComponent.querySelector('.mock-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                alert(`Playing "${song.title}" from URL: ${song.url || 'No URL given'}`);
            });
        }
    }
});

// Function to navigate to the song page from other files
function openSong(id) {
    globalThis.location.href = `/frontend/pages/song.html?id=${id}`;
}

document.addEventListener("DOMContentLoaded", () => {
    // Mock database
    const mockSongs = {
        '1': { title: 'Example Song 1', artist: 'Artist A' },
        '2': { title: 'Test Track 2', artist: 'Artist B' },
        '3': { title: 'Great Summer Hit', artist: 'Artist C' }
    };

    // Get song ID from URL parameters (?id=1)
    const urlParams = new URLSearchParams(globalThis.location.search);
    const songId = urlParams.get('id');

    // Set song info or show default
    const song = songId && mockSongs[songId] 
        ? mockSongs[songId] 
        : { title: 'Unknown Song', artist: 'No artist' };

    // Update UI
    document.getElementById('song-title').textContent = song.title;
    document.getElementById('song-artist').textContent = song.artist;

    // Play button logic
    const playBtn = document.getElementById('mock-play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            alert(`Mock: Playing "${song.title}"`);
        });
    }
});

// Function to navigate to the song page from other files
function openSong(id) {
    globalThis.location.href = `/frontend/pages/song.html?id=${id}`;
}

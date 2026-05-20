const createSongElement = (tagName, song) => {
    const element = document.createElement(tagName);
    element.setAttribute('song-id', song.id);
    element.setAttribute('title', song.title);
    element.setAttribute('artist', song.artist);

    if (song.imageUrl) {
        element.setAttribute('image', song.imageUrl);
    }

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
        const topResponse = await fetch('/api/songs/top/liked?limit=5');

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

document.addEventListener('DOMContentLoaded', async () => {
    const newUploadsList = document.getElementById('new-uploads-list');
    const top10List = document.getElementById('top10-widget');
    const pastUploadsList = document.getElementById('past-uploads-widget');

    await loadNewUploads(newUploadsList);
    await loadTopSongs(top10List);
    await loadPastUploads(pastUploadsList);
});

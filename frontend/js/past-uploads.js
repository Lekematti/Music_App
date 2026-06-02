import { API_BASE } from './helpers/config.js';

const initPastUploads = async () => {
    const listContainer = document.getElementById('past-uploads-list');
    if (!listContainer) {
        return;
    }
    const token = localStorage.getItem('token');

    if (!token) {
        listContainer.innerHTML = '<p style="color: #888;">You need to be logged in to view your uploads.</p>';
        return;
    }

    try {
        // Decode token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.id || null;

        if (!currentUserId) {
            listContainer.innerHTML = '<p style="color: red;">Failed to read user data.</p>';
            return;
        }

        // Fetch songs specifically for the logged-in user
        const response = await fetch(`${API_BASE}/api/songs?userId=${currentUserId}`);
        
        if (response.ok) {
            let songs = await response.json();

            // Sort chronologically (oldest first)
            songs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            listContainer.innerHTML = '';

            if (songs.length === 0) {
                listContainer.innerHTML = '<p style="color: #888;">You haven\'t uploaded any music yet.</p>';
                return;
            }

            // Create items dynamically
            songs.forEach((song, index) => {
                const item = document.createElement('list-row-item');
                item.setAttribute('song-id', song.id);
                item.setAttribute('rank', `${index + 1}.`);
                item.setAttribute('title', song.title);
                item.setAttribute('artist', song.artist);
                // determine average score: prefer explicit averageRating, otherwise compute from ratings array
                let avgScore;
                if (song.averageRating !== null && song.averageRating !== undefined) {
                    avgScore = song.averageRating;
                } else if (song.ratings?.length > 0) {
                    avgScore = song.ratings.reduce((a, r) => a + r.score, 0) / song.ratings.length;
                } else {
                    avgScore = 0;
                }
                item.setAttribute('score', avgScore.toFixed(1));
                if (song.imageUrl) item.setAttribute('image', song.imageUrl);

                listContainer.appendChild(item);
            });
        } else {
            console.error('Failed to fetch user uploads');
            listContainer.innerHTML = '<p style="color: red;">Failed to load your songs.</p>';
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        listContainer.innerHTML = '<p style="color: red;">Cannot connect to the server.</p>';
    }
};

document.addEventListener('DOMContentLoaded', initPastUploads);
document.addEventListener('router:contentLoaded', initPastUploads);

document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('past-uploads-list');
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
        const response = await fetch(`/api/songs?userId=${currentUserId}`);
        
        if (response.ok) {
            const songs = await response.json();
            
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
                item.setAttribute('score', song.likes ? song.likes.length : 0);
                
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
});

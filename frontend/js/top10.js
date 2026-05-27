const initTop10 = async () => {
    const listContainer = document.getElementById('top10-list');

    if (!listContainer) {
        return;
    }

    try {
        // Fetch top 10 liked songs from backend
        const response = await fetch('/api/songs/top/rated?limit=10');
        
        if (response.ok) {
            const songs = await response.json();
            
            listContainer.innerHTML = '';
            
            if (songs.length === 0) {
                listContainer.innerHTML = '<p style="color: #888;">No songs available yet.</p>';
                return;
            }

            // Create items dynamically with ranking
            songs.forEach((song, index) => {
                const item = document.createElement('list-row-item');
                item.setAttribute('song-id', song.id);
                item.setAttribute('rank', `${index + 1}.`);
                item.setAttribute('title', song.title);
                item.setAttribute('artist', song.artist);
                let avgScore = song.averageRating;
                if (avgScore == null) {
                    if (song.ratings?.length) {
                        avgScore = song.ratings.reduce((a, r) => a + r.score, 0) / song.ratings.length;
                    } else {
                        avgScore = 0;
                    }
                }
                item.setAttribute('score', avgScore.toFixed(1));
                if (song.imageUrl) item.setAttribute('image', song.imageUrl);
                
                listContainer.appendChild(item);
            });
        } else {
            console.error('Failed to fetch top songs');
            listContainer.innerHTML = '<p style="color: red;">Failed to load top songs.</p>';
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        listContainer.innerHTML = '<p style="color: red;">Cannot connect to the server.</p>';
    }
};

document.addEventListener('DOMContentLoaded', initTop10);
document.addEventListener('router:contentLoaded', initTop10);


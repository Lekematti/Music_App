document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('new-uploads-list');
    if (!listContainer) {
        return;
    }
    const itemsPerPage = 20;

    async function loadSongs(page = 1) {
        try {
            // Fetch all songs from backend
            const response = await fetch('/api/songs');
            
            if (response.ok) {
                const allSongs = await response.json();

                // Limit to the 50 newest songs (server returns newest first)
                const newest50 = allSongs.slice(0, 50);

                // Calculate pagination on the limited set
                const totalPages = Math.ceil(newest50.length / itemsPerPage);
                const startIndex = (page - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const songs = newest50.slice(startIndex, endIndex);
                
                listContainer.innerHTML = '';
                
                if (songs.length === 0) {
                    listContainer.innerHTML = '<p style="color: #888;">No songs available yet.</p>';
                    return;
                }

                // Create items dynamically
                songs.forEach((song, index) => {
                    const rankNumber = startIndex + index + 1;
                    const item = document.createElement('list-row-item');
                    item.setAttribute('song-id', song.id);
                    item.setAttribute('rank', `${rankNumber}.`);
                    item.setAttribute('title', song.title);
                    item.setAttribute('artist', song.artist);
                    if (song.imageUrl) item.setAttribute('image', song.imageUrl);
                    
                    listContainer.appendChild(item);
                });

                // Add pagination controls if there are multiple pages
                if (totalPages > 1) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.style.display = 'flex';
                    paginationDiv.style.justifyContent = 'center';
                    paginationDiv.style.gap = '10px';
                    paginationDiv.style.marginTop = '20px';
                    paginationDiv.style.paddingBottom = '60px';

                    if (page > 1) {
                        const prevBtn = document.createElement('button');
                        prevBtn.textContent = 'Previous';
                        prevBtn.style.padding = '8px 16px';
                        prevBtn.style.backgroundColor = '#333';
                        prevBtn.style.color = '#fff';
                        prevBtn.style.border = 'none';
                        prevBtn.style.borderRadius = '4px';
                        prevBtn.style.cursor = 'pointer';
                        prevBtn.onclick = () => loadSongs(page - 1);
                        paginationDiv.appendChild(prevBtn);
                    }

                    const pageInfo = document.createElement('span');
                    pageInfo.textContent = `Page ${page} of ${totalPages}`;
                    pageInfo.style.alignSelf = 'center';
                    pageInfo.style.color = '#888';
                    paginationDiv.appendChild(pageInfo);

                    if (page < totalPages) {
                        const nextBtn = document.createElement('button');
                        nextBtn.textContent = 'Next';
                        nextBtn.style.padding = '8px 16px';
                        nextBtn.style.backgroundColor = '#333';
                        nextBtn.style.color = '#fff';
                        nextBtn.style.border = 'none';
                        nextBtn.style.borderRadius = '4px';
                        nextBtn.style.cursor = 'pointer';
                        nextBtn.onclick = () => loadSongs(page + 1);
                        paginationDiv.appendChild(nextBtn);
                    }

                    listContainer.parentElement.appendChild(paginationDiv);
                }
            } else {
                console.error('Failed to fetch songs');
                listContainer.innerHTML = '<p style="color: red;">Failed to load songs.</p>';
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
            listContainer.innerHTML = '<p style="color: red;">Cannot connect to the server.</p>';
        }
    }

    // Load first page on page load
    loadSongs(1);
});

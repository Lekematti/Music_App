/* eslint-disable no-unused-vars */
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

const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error('Error fetching current user:', e);
    }
    return null;
};

const updateRatingUI = (userRating, averageRating, ratingCount) => {
    const stars = document.querySelectorAll('.star');
    const averageRatingEl = document.getElementById('average-rating');
    const ratingCountEl = document.getElementById('rating-count');
    
    // Update stars based on user rating
    stars.forEach((star, index) => {
        if (index < userRating) {
            star.textContent = '★';
            star.style.color = '#f39c12';
        } else {
            star.textContent = '☆';
            star.style.color = '#555';
        }
    });

    if (averageRatingEl) {
        averageRatingEl.textContent = averageRating.toFixed(1);
    }
    if (ratingCountEl) {
        ratingCountEl.textContent = ratingCount;
    }
};

const submitRating = async (songId, score) => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to rate a song!');
        return null;
    }
    
    try {
        const response = await fetch(`/api/songs/${songId}/rate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score })
        });
        
        if (!response.ok) {
            console.error('Failed to submit rating');
            return null;
        }
        return await response.json();
    } catch (e) {
        console.error(e);
        return null;
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

let initializingSongPage = false;

const syncPersistentPlayer = (song) => {
    const playerComponent = document.getElementById('global-player') || document.querySelector('audio-player-component');
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

    // Initialize Rating functionality
    const user = await getCurrentUser();
    const ratingsList = song.ratings || [];
    
    let userRating = 0;
    if (user) {
        const existingRating = ratingsList.find(r => r.userId === user.id);
        if (existingRating) userRating = existingRating.score;
    }
    
    let totalScore = ratingsList.reduce((acc, r) => acc + r.score, 0);
    let ratingCount = ratingsList.length;
    let averageRating = ratingCount > 0 ? (totalScore / ratingCount) : 0;

    updateRatingUI(userRating, averageRating, ratingCount);

    // Wipe any previously attached star listeners by cloning the container
    const starsContainer = document.querySelector('.star')?.parentElement;
    if (starsContainer) {
        const freshContainer = starsContainer.cloneNode(true);
        starsContainer.replaceWith(freshContainer);
    }

    const stars = document.querySelectorAll('.star');
    const starsParent = stars[0]?.parentElement;

    stars.forEach((star) => {
        star.addEventListener('click', async (e) => {
            if (!song.id) return;
            const score = Number.parseInt(e.target.dataset.value);
            
            const oldUserRating = userRating;
            userRating = score;
            
            if (oldUserRating === 0) {
                ratingCount++;
                totalScore += score;
            } else {
                totalScore = totalScore - oldUserRating + score;
            }
            averageRating = totalScore / ratingCount;
            
            updateRatingUI(userRating, averageRating, ratingCount);
            
            const result = await submitRating(song.id, score);
            if (!result) {
                userRating = oldUserRating;
                if (oldUserRating === 0) {
                    ratingCount--;
                    totalScore -= score;
                } else {
                    totalScore = totalScore - score + oldUserRating;
                }
                averageRating = ratingCount > 0 ? totalScore / ratingCount : 0;
                updateRatingUI(userRating, averageRating, ratingCount);
            }
        });
        
        star.addEventListener('mouseenter', (e) => {
            const hoverValue = Number.parseInt(e.target.dataset.value);
            stars.forEach((s, index) => {
                s.textContent = index < hoverValue ? '★' : '☆';
                s.style.color = index < hoverValue ? '#f39c12' : '#555';
            });
        });
    });

    // Single mouseleave on the parent instead of one per star
    if (starsParent) {
        starsParent.addEventListener('mouseleave', () => {
            updateRatingUI(userRating, averageRating, ratingCount);
        });
    }
};

const runSongPageInitialization = async () => {
    if (!document.getElementById('song-title')) {
        return;
    }

    if (initializingSongPage) return;

    initializingSongPage = true;
    try {
        await initializeSongPage();
    } finally {
        initializingSongPage = false;
    }
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

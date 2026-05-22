// Load user profile data
const loadUserProfile = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            globalThis.location.href = './login.html';
            return;
        }

        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (userResponse.status === 401 || userResponse.status === 404) {
            // Token is invalid or user doesn't exist anymore
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            globalThis.location.href = './login.html';
            return;
        }

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();

        // Update user info in the card
        document.getElementById('user-name').textContent = userData.username || 'User';
        document.getElementById('user-email').textContent = userData.email || '';

        // Set avatar if available
        const avatarImg = document.getElementById('user-avatar-img');
        if (userData.avatarUrl) {
            avatarImg.src = userData.avatarUrl;
        } else {
            // Use default avatar or icon
            avatarImg.src = '../assets/icons/profile.png';
            avatarImg.style.padding = '20px';
            avatarImg.style.opacity = '0.6';
        }

        // Fetch user's songs with their stats
        const songsResponse = await fetch(`/api/songs?userId=${userData.id}`);
        
        if (songsResponse.ok) {
            const userSongs = await songsResponse.json();
            
            // Update publication count
            document.getElementById('publication-count').textContent = userSongs.length;
            
            // Calculate total likes
            let totalLikes = 0;
            userSongs.forEach(song => {
                totalLikes += song.likes ? song.likes.length : 0;
            });
            
            // Update total likes stat
            document.getElementById('total-likes').textContent = totalLikes;
            
            // Update publications section
            const publicationList = document.querySelector('.publication-list');
            if (publicationList) {
                publicationList.innerHTML = '';

                if (!publicationList.dataset.deleteListenerAttached) {
                    publicationList.addEventListener('publication-delete', async (event) => {
                        const { songId, title } = event.detail || {};
                        if (!songId) {
                            return;
                        }

                        const confirmed = globalThis.confirm(`Delete "${title}"? This cannot be undone.`);
                        if (!confirmed) {
                            return;
                        }

                        try {
                            const token = localStorage.getItem('token');
                            const deleteResponse = await fetch(`/api/songs/${songId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (!deleteResponse.ok) {
                                const errorData = await deleteResponse.json();
                                throw new Error(errorData.message || 'Failed to delete song');
                            }

                            loadUserProfile();
                        } catch (error) {
                            console.error('Error deleting song:', error);
                            alert(error.message || 'Unable to delete song.');
                        }
                    });

                    publicationList.dataset.deleteListenerAttached = 'true';
                }
                
                if (userSongs.length === 0) {
                    publicationList.innerHTML = '<p style="color: #888;">You haven\'t published any music yet.</p>';
                } else {
                    userSongs.forEach(song => {
                        const pubDate = new Date(song.createdAt).toLocaleDateString('en-US');
                        const songLikes = song.likes ? song.likes.length : 0;

                        const pubItem = document.createElement('publication-item');
                        pubItem.setAttribute('title', song.title);
                        pubItem.setAttribute('artist', song.artist);
                        pubItem.setAttribute('subtitle', `Published: ${pubDate}`);
                        pubItem.setAttribute('song-id', song.id);
                        if (song.imageUrl) {
                            pubItem.setAttribute('image', song.imageUrl);
                        }
                        pubItem.setAttribute('stats', `${songLikes} like${songLikes !== 1 ? 's' : ''}`);
                        pubItem.setAttribute('show-menu', '');

                        publicationList.appendChild(pubItem);
                    });
                }

            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        document.getElementById('user-name').textContent = 'Error';
        document.getElementById('user-email').textContent = 'Failed to load profile';
    }
};

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Tab switching logic
const navItems = document.querySelectorAll('#profile-nav li');
const sections = document.querySelectorAll('.profile-tab');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Reset all nav items: remove active class and set icon to settings
        navItems.forEach(nav => {
            nav.classList.remove('active');
            const img = nav.querySelector('img.sidebar-icon');
            if (img) img.src = '../assets/icons/settings.png';
        });
        
        // Set the clicked item as active and change its icon to profile
        item.classList.add('active');
        const activeImg = item.querySelector('img.sidebar-icon');
        if (activeImg && item.dataset.target === 'publications-section') {
            activeImg.src = '../assets/icons/profile.png';
        }

        // Hide all sections
        sections.forEach(sec => sec.style.display = 'none');

        // Show selected section
        const targetId = item.dataset.target;
        if (targetId) {
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.style.display = 'block';
        }
    });
});

// Logout function
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        globalThis.location.href = './login.html';
    });
}

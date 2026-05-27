const getProfileElements = () => {
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const avatarImg = document.getElementById('user-avatar-img');
    const publicationCountEl = document.getElementById('publication-count');
    const totalLikesEl = document.getElementById('total-likes');
    const publicationList = document.querySelector('.publication-list');

    if (!userNameEl || !userEmailEl || !avatarImg || !publicationCountEl || !totalLikesEl || !publicationList) {
        return null;
    }

    return {
        userNameEl,
        userEmailEl,
        avatarImg,
        publicationCountEl,
        totalLikesEl,
        publicationList,
    };
};

const renderProfileSongs = (publicationList, userSongs) => {
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
        return;
    }

    userSongs.forEach((song) => {
        const pubDate = new Date(song.createdAt).toLocaleDateString('en-US');
        
        let avgRating = 0;
        let ratingsCount = 0;
        if (song.ratings && song.ratings.length > 0) {
            ratingsCount = song.ratings.length;
            const sum = song.ratings.reduce((acc, r) => acc + r.score, 0);
            avgRating = (sum / ratingsCount).toFixed(1);
        }

        const pubItem = document.createElement('publication-item');
        pubItem.setAttribute('title', song.title);
        pubItem.setAttribute('artist', song.artist);
        pubItem.setAttribute('subtitle', `Published: ${pubDate}`);
        pubItem.setAttribute('song-id', song.id);
        if (song.imageUrl) {
            pubItem.setAttribute('image', song.imageUrl);
        }

        const statsText = ratingsCount > 0 ? `Avg Rating: ★ ${avgRating} (${ratingsCount})` : 'No ratings yet';
        pubItem.setAttribute('stats', statsText);
        pubItem.setAttribute('show-menu', '');

        publicationList.appendChild(pubItem);
    });
};

const redirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    globalThis.location.href = './login.html';
};

const setUserAvatar = (avatarImg, avatarUrl) => {
    if (avatarUrl) {
        avatarImg.src = avatarUrl;
        return;
    }

    avatarImg.src = '../assets/icons/profile.png';
    avatarImg.style.padding = '20px';
    avatarImg.style.opacity = '0.6';
};

const getOverallAverageRating = (userSongs) => {
    const totals = userSongs.reduce((acc, song) => {
        if (!song.ratings) {
            return acc;
        }

        acc.totalRatings += song.ratings.length;
        acc.totalScore += song.ratings.reduce((sum, r) => sum + r.score, 0);
        return acc;
    }, { totalScore: 0, totalRatings: 0 });

    return totals.totalRatings > 0 ? (totals.totalScore / totals.totalRatings).toFixed(1) : '0.0';
};

const updateAvgRatingLabel = () => {
    const likesLabelEl = document.querySelector('.stats-container .stat-item:nth-child(2) .stat-label');
    if (likesLabelEl?.textContent.trim().toLowerCase() === 'likes') {
        likesLabelEl.textContent = 'Avg Rating';
    }
};

const fetchCurrentUser = async (token) => {
    const userResponse = await fetch('/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (userResponse.status === 401 || userResponse.status === 404) {
        redirectToLogin();
        return null;
    }

    if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
    }

    return userResponse.json();
};

// Load user profile data
const loadUserProfile = async () => {
    try {
        const profileElements = getProfileElements();

        if (!profileElements) {
            return;
        }

        const {
            userNameEl,
            userEmailEl,
            avatarImg,
            publicationCountEl,
            totalLikesEl,
            publicationList,
        } = profileElements;

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            globalThis.location.href = './login.html';
            return;
        }

        const userData = await fetchCurrentUser(token);
        if (!userData) {
            return;
        }

        userNameEl.textContent = userData.username || 'User';
        userEmailEl.textContent = userData.email || '';
        setUserAvatar(avatarImg, userData.avatarUrl);

        const songsResponse = await fetch(`/api/songs?userId=${userData.id}`);
        
        if (songsResponse.ok) {
            const userSongs = await songsResponse.json();
            
            publicationCountEl.textContent = userSongs.length;
            const overallAvg = getOverallAverageRating(userSongs);

            updateAvgRatingLabel();
            totalLikesEl.textContent = `${overallAvg} ★`;
            
            renderProfileSongs(publicationList, userSongs);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        if (userNameEl) userNameEl.textContent = 'Error';
        if (userEmailEl) userEmailEl.textContent = 'Failed to load profile';
    }
};

// Wrap all init logic so it can be re-run after router navigation
const initProfilePage = () => {
    if (!document.getElementById('user-name')) return; // not on profile page

    loadUserProfile();

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
            globalThis.location.href = './login.html';
        });
    }

    // Tab switching
    const navItems = document.querySelectorAll('#profile-nav li');
    const sections = document.querySelectorAll('.profile-tab');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => {
                nav.classList.remove('active');
                const img = nav.querySelector('img.sidebar-icon');
                if (img) img.src = '../assets/icons/settings.png';
            });

            item.classList.add('active');
            const activeImg = item.querySelector('img.sidebar-icon');
            if (activeImg && item.dataset.target === 'publications-section') {
                activeImg.src = '../assets/icons/profile.png';
            }

            sections.forEach(sec => sec.style.display = 'none');
            const targetEl = document.getElementById(item.dataset.target);
            if (targetEl) targetEl.style.display = 'block';
        });
    });
};

document.addEventListener('DOMContentLoaded', initProfilePage);
document.addEventListener('router:contentLoaded', initProfilePage);
import { API_BASE } from './helpers/config.js';

const getProfileElements = () => {
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const avatarImg = document.getElementById('user-avatar-img');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
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
        changeAvatarBtn,
        publicationCountEl,
        totalLikesEl,
        publicationList,
    };
};

// API base: when running frontend via Vite dev server (port 5173),
// send requests to backend on localhost:5000. In production the backend
// serves the frontend so use relative paths.
// const API_BASE = (globalThis.location.hostname === 'localhost' && globalThis.location.port === '5173')
//     ? 'http://localhost:5000'
//     : '';

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
                const deleteResponse = await fetch(`${API_BASE}/api/songs/${songId}`, {
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
        avatarImg.style.padding = '';
        avatarImg.style.opacity = '';
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
    const userResponse = await fetch(`${API_BASE}/api/auth/me`, {
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

const updateProfileAvatar = async (avatarImg, avatarFile) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatarFile', avatarFile);

    const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile picture');
    }

    setUserAvatar(avatarImg, data.avatarUrl);
    if (data.token) {
        localStorage.setItem('token', data.token);
    }
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

        const songsResponse = await fetch(`${API_BASE}/api/songs?userId=${userData.id}`);

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

    // Delete account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn && !deleteBtn.dataset.listenerAttached) {
        deleteBtn.addEventListener('click', async () => {
            const confirmed = globalThis.confirm('Delete your account and all your songs? This cannot be undone.');
            if (!confirmed) return;

            try {
                deleteBtn.disabled = true;
                deleteBtn.setAttribute('aria-busy', 'true');
                const token = localStorage.getItem('token');
                const resp = await fetch(`${API_BASE}/api/auth/me`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!resp.ok) {
                    const data = await resp.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to delete account');
                }

                // Clear local session and redirect to register page
                localStorage.removeItem('token');
                localStorage.removeItem('isLoggedIn');
                globalThis.location.href = './register.html';
            } catch (err) {
                console.error('Account delete error:', err);
                alert(err.message || 'Unable to delete account');
            } finally {
                deleteBtn.disabled = false;
                deleteBtn.removeAttribute('aria-busy');
            }
        });

        deleteBtn.dataset.listenerAttached = 'true';
    }

    const avatarImg = document.getElementById('user-avatar-img');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarFileInput = document.getElementById('avatar-file-input');
    if (changeAvatarBtn && avatarFileInput && !changeAvatarBtn.dataset.listenerAttached) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarFileInput.click();
        });

        changeAvatarBtn.dataset.listenerAttached = 'true';
    }

    if (avatarFileInput && !avatarFileInput.dataset.listenerAttached) {
        avatarFileInput.addEventListener('change', async () => {
            const avatarFile = avatarFileInput.files?.[0];
            if (!avatarFile) {
                return;
            }

            const previewUrl = URL.createObjectURL(avatarFile);
            setUserAvatar(avatarImg, previewUrl);

            try {
                if (changeAvatarBtn) {
                    changeAvatarBtn.disabled = true;
                    changeAvatarBtn.setAttribute('aria-busy', 'true');
                }

                await updateProfileAvatar(avatarImg, avatarFile);
                alert('Profile picture updated');
            } catch (error) {
                console.error('Avatar update error:', error);
                alert(error.message || 'Unable to update profile picture');
            } finally {
                URL.revokeObjectURL(previewUrl);
                avatarFileInput.value = '';
                if (changeAvatarBtn) {
                    changeAvatarBtn.disabled = false;
                    changeAvatarBtn.removeAttribute('aria-busy');
                }
            }
        });

        avatarFileInput.dataset.listenerAttached = 'true';
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

    // Profile update forms
    const passwordForm = document.querySelector('#password-section form');
    const usernameForm = document.querySelector('#username-section form');
    const emailForm = document.querySelector('#email-section form');

    if (passwordForm && !passwordForm.dataset.listenerAttached) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const current = document.getElementById('current-password')?.value || '';
            const next = document.getElementById('new-password')?.value || '';
            if (!current || !next) return alert('Please fill both password fields.');
            try {
                const token = localStorage.getItem('token');
                const resp = await fetch(`${API_BASE}/api/auth/me/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword: current, newPassword: next })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.message || 'Failed to update password');

                alert('Password updated successfully');
                // Clear inputs
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
            } catch (err) {
                console.error('Password update error:', err);
                alert(err.message || 'Unable to update password');
            }
        });
        passwordForm.dataset.listenerAttached = 'true';
    }

    if (usernameForm && !usernameForm.dataset.listenerAttached) {
        usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('new-username')?.value || '';
            if (!newUsername) return alert('Enter a username');
            try {
                const token = localStorage.getItem('token');
                const resp = await fetch(`${API_BASE}/api/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username: newUsername })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.message || 'Failed to update username');

                // Update displayed username and refresh token
                const userNameEl = document.getElementById('user-name');
                if (userNameEl) userNameEl.textContent = data.username || newUsername;
                if (data.token) localStorage.setItem('token', data.token);

                alert('Username updated');
            } catch (err) {
                console.error('Username update error:', err);
                alert(err.message || 'Unable to update username');
            }
        });
        usernameForm.dataset.listenerAttached = 'true';
    }

    if (emailForm && !emailForm.dataset.listenerAttached) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('new-email')?.value || '';
            if (!newEmail) return alert('Enter an email');
            try {
                const token = localStorage.getItem('token');
                const resp = await fetch(`${API_BASE}/api/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: newEmail })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.message || 'Failed to update email');

                const userEmailEl = document.getElementById('user-email');
                if (userEmailEl) userEmailEl.textContent = data.email || newEmail;
                if (data.token) localStorage.setItem('token', data.token);

                alert('Email updated');
            } catch (err) {
                console.error('Email update error:', err);
                alert(err.message || 'Unable to update email');
            }
        });
        emailForm.dataset.listenerAttached = 'true';
    }
};

document.addEventListener('DOMContentLoaded', initProfilePage);
document.addEventListener('router:contentLoaded', initProfilePage);
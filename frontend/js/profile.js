// Load user profile data
const loadUserProfile = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No token found');
            return;
        }

        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

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

        // Fetch and count user's publications
        const songsResponse = await fetch('/api/songs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (songsResponse.ok) {
            const songs = await songsResponse.json();
            // Count songs by current user
            const userSongs = songs.filter(song => song.userId === userData.id);
            document.getElementById('publication-count').textContent = userSongs.length;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
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
        if (activeImg) activeImg.src = '../assets/icons/profile.png';

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
        localStorage.removeItem('isLoggedIn');
        globalThis.location.href = 'login.html';
    });
}

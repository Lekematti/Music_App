import { API_BASE } from './config.js';

(() => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const setMessage = (message, type = 'error') => {
        const registerMessage = document.getElementById('register-message');
        if (!registerMessage) return;
        registerMessage.textContent = message;
        registerMessage.dataset.type = type;
    };

    const initRegisterPage = () => {
        const registerForm = document.getElementById('register-form');
        if (!registerForm) return;
        if (registerForm.dataset.listenerAttached) return; // prevent double-attach
        registerForm.dataset.listenerAttached = 'true';

        const avatarFileInput = document.getElementById('avatar-file');
        const avatarFileButton = document.getElementById('avatar-file-button');
        const avatarFileName = document.getElementById('avatar-file-name');

        if (avatarFileButton && avatarFileInput && !avatarFileButton.dataset.listenerAttached) {
            avatarFileButton.addEventListener('click', () => {
                avatarFileInput.click();
            });

            avatarFileButton.dataset.listenerAttached = 'true';
        }

        if (avatarFileInput && avatarFileName && !avatarFileInput.dataset.listenerAttached) {
            avatarFileInput.addEventListener('change', () => {
                const file = avatarFileInput.files?.[0];
                avatarFileName.textContent = file ? file.name : 'No file chosen';
            });

            avatarFileInput.dataset.listenerAttached = 'true';
        }

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            const avatarFile = avatarFileInput?.files?.[0] || null;

            if (!username || !email || !password) {
                setMessage('Please fill in all fields');
                return;
            }

            if (username.length < 3) {
                setMessage('Username must be at least 3 characters long');
                return;
            }

            if (!isValidEmail(email)) {
                setMessage('Please enter a valid email address');
                return;
            }

            if (password.length < 6) {
                setMessage('Password must be at least 6 characters long');
                return;
            }

            try {
                setMessage('');

                const payload = new FormData();
                payload.append('username', username);
                payload.append('email', email);
                payload.append('password', password);
                if (avatarFile) {
                    payload.append('avatarFile', avatarFile);
                }

                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    body: payload,
                });

                const data = await response.json();

                if (!response.ok) {
                    setMessage(data.message || 'Registration failed');
                    return;
                }

                setMessage('Account created. Redirecting to login...', 'success');
                globalThis.setTimeout(() => {
                    globalThis.location.href = './login.html';
                }, 900);
            } catch {
                setMessage('Unable to reach the server');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', initRegisterPage);
    document.addEventListener('router:contentLoaded', initRegisterPage);
})();
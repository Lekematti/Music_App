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

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

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

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
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
(() => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const setMessage = (message, type = 'error') => {
        const loginMessage = document.getElementById('login-message');
        if (!loginMessage) return;
        loginMessage.textContent = message;
        loginMessage.dataset.type = type;
    };

    const initLoginPage = () => {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;
        if (loginForm.dataset.listenerAttached) return;
        loginForm.dataset.listenerAttached = 'true';

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                setMessage('Please fill in all fields');
                return;
            }

            if (!isValidEmail(email)) {
                setMessage('Please enter a valid email address');
                return;
            }

            try {
                setMessage('');

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setMessage(data.message || 'Login failed');
                    return;
                }

                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.email);

                globalThis.location.href = '../index.html';
            } catch {
                setMessage('Unable to reach the server');
            }
        });
    };

    document.addEventListener('DOMContentLoaded', initLoginPage);
    document.addEventListener('router:contentLoaded', initLoginPage);
})();
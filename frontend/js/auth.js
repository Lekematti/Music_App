// Check if user is logged in and has a valid token
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
const hasToken = localStorage.getItem('token') !== null;

if (!isLoggedIn || !hasToken) {
    // Define the redirect destination based on current path
    const isRootIndex = globalThis.location.pathname.endsWith('/index.html') || globalThis.location.pathname === '/' || globalThis.location.pathname === '';
    const loginPath = isRootIndex ? './pages/login.html' : 'login.html';
    globalThis.location.href = loginPath;
}
    
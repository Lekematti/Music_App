// Check if user is logged in and has a valid token
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
const hasToken = localStorage.getItem('token') !== null;
const currentPath = globalThis.location.pathname;

// Allow public access to login and register pages
const isPublicPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');

if (!isPublicPage && (!isLoggedIn || !hasToken)) {
    // Define the redirect destination based on current path
    const isRootIndex = currentPath.endsWith('/index.html') || currentPath === '/' || currentPath === '';
    const loginPath = isRootIndex ? './pages/login.html' : 'login.html';
    globalThis.location.href = loginPath;
}
    
if (localStorage.getItem('isLoggedIn') !== 'true') {
    globalThis.location.href = './pages/login.html';
}
    
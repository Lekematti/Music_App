const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function(tapahtuma) {
    
    tapahtuma.preventDefault();

    localStorage.setItem('isLoggedIn', 'true');
    
    globalThis.location.href = '../index.html';
});
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function(event) {
    
    event.preventDefault();

    localStorage.setItem('isLoggedIn', 'true');
    
    globalThis.location.href = '../index.html';
});
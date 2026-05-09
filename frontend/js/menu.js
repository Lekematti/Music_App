document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const sideMenu = document.getElementById('side-menu');

    if (menuBtn && closeBtn && sideMenu) {
        // Avaa valikko (lisää "open" -luokka)
        menuBtn.addEventListener('click', () => {
            sideMenu.classList.add('open');
        });

        // Sulje valikko (poistaa "open" -luokan)
        closeBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open');
        });
    }
});
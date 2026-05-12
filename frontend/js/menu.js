// Luodaan Web Component sivupalkkia varten
class SideMenuComponent extends HTMLElement {
    connectedCallback() {
        // Tunnistetaan ollaanko alikansiossa (pages)
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const basePath = isPagesDir ? '../' : './';
        const pagesPath = isPagesDir ? './' : './pages/';

        // Renderöidään HTML komponentin sisälle
        this.innerHTML = `
            <aside id="side-menu" class="side-menu">
                <div class="side-menu-header">
                    <h2>Menu</h2>
                    <button id="close-btn" class="close-btn">X</button>
                </div>
                <ul class="side-menu-list">
                    <li><a href="${pagesPath}profile.html"><img src="${basePath}assets/icons/profile.png" alt="Profile" class="menu-icon"> Profile</a></li>
                    <li><a href="${pagesPath}settings.html"><img src="${basePath}assets/icons/settings.png" alt="Settings" class="menu-icon"> Settings</a></li>
                </ul>
            </aside>
        `;

        const sideMenu = this.querySelector('#side-menu');
        const closeBtn = this.querySelector('#close-btn');

        // Etsitään kaikki valikkonapit sivulta ja lisätään niihin klikkauskuuntelija
        const menuBtns = document.querySelectorAll('.menu-btn, #menu-btn');
        menuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                sideMenu.classList.add('open');
            });
        });

        // Sulkemisnappi
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sideMenu.classList.remove('open');
            });
        }
    }
}

// Määritellään uusi HTML-elementti <side-menu-component>
customElements.define('side-menu-component', SideMenuComponent);

// Kun koko sivu on ladattu, lisätään komponentti automaattisesti sivun body-elementtiin,
// joten sitä ei tarvitse lisätä manuaalisesti jokaiseen HTML-tiedostoon!
document.addEventListener('DOMContentLoaded', () => {
    // Varmistetaan, ettei sitä ole jo lisätty
    if (!document.querySelector('side-menu-component')) {
        const menuElement = document.createElement('side-menu-component');
        document.body.appendChild(menuElement);
    }
});
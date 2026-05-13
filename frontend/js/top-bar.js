class TopBarComponent extends HTMLElement {
    connectedCallback() {
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const basePath = isPagesDir ? '../' : './';
        
        this.innerHTML = `
            <header class="top-bar">
                <div class="logo">
                    <a href="${basePath}index.html"><img src="${basePath}assets/icons/logo.png" alt="Logo"></a>
                </div>
                <div class="search-bar">
                    <input type="text" placeholder="Search songs, artists, albums...">
                    <button class="search-icon"><img src="${basePath}assets/icons/search.png" alt="Search"></button>
                </div>
                <div class="user-nav">
                    <button id="menu-btn" class="menu-btn"><img src="${basePath}assets/icons/list.png" alt="Menu"></button>
                </div>
            </header>
        `;
        
        // Re-attach menu event listener since we dynamically created the menu-btn
        const menuBtn = this.querySelector('#menu-btn');
        const sideMenu = document.querySelector('#side-menu'); // from menu.js
        if (menuBtn && sideMenu) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                sideMenu.classList.add('open');
            });
        }
    }
}
customElements.define('top-bar-component', TopBarComponent);

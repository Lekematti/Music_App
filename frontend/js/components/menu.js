// Create a Web Component for the side menu
class SideMenuComponent extends HTMLElement {
    connectedCallback() {
        // Detect if we are in a subdirectory (pages)
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const basePath = isPagesDir ? '../' : './';
        const pagesPath = isPagesDir ? './' : './pages/';

        // Render HTML inside the component
        this.innerHTML = `
            <aside id="side-menu" class="side-menu">
                <div class="side-menu-header">
                    <h2>Menu</h2>
                    <button id="close-btn" class="close-btn">X</button>
                </div>
                <ul class="side-menu-list">
                    <li><a href="${pagesPath}profile.html"><img src="${basePath}assets/icons/profile.png" alt="Profile" class="menu-icon"> Profile</a></li>
                    <li><a href="${pagesPath}upload.html"><img src="${basePath}assets/icons/upload.png" alt="Upload" class="menu-icon"> Upload</a></li>
                    <li><a href="${pagesPath}settings.html"><img src="${basePath}assets/icons/settings.png" alt="Settings" class="menu-icon"> Settings</a></li>
                </ul>
            </aside>
        `;

        const sideMenu = this.querySelector('#side-menu');
        const closeBtn = this.querySelector('#close-btn');

        // Allow opening via global event to avoid race conditions with other components
        document.addEventListener('click', (e) => {
            if (e.target.closest('.menu-btn, #menu-btn')) {
                e.preventDefault();
                sideMenu.classList.add('open');
            }
        });

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sideMenu.classList.remove('open');
            });
        }
    }
}

// Define new HTML element <side-menu-component>
customElements.define('side-menu-component', SideMenuComponent);

// When the whole page is loaded, add the component automatically to the body element,
// so there is no need to manually add it to every HTML file!
document.addEventListener('DOMContentLoaded', () => {
    // Ensure it hasn't been added already
    if (!document.querySelector('side-menu-component')) {
        const menuElement = document.createElement('side-menu-component');
        document.body.appendChild(menuElement);
    }
});
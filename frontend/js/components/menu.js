// Create a Web Component for the side menu
class SideMenuComponent extends HTMLElement {
    connectedCallback() {
        this._render();
        this._attachListeners();
    }

    disconnectedCallback() {
        document.removeEventListener('click', this._handleDocumentClick);
    }

    _render() {
        // Derive basePath from the current page location so links work
        // regardless of whether the app is served from root or a subdirectory
        const basePath = document.querySelector('base')?.href ?? '/';

        this.innerHTML = `
            <aside id="side-menu" class="side-menu" aria-hidden="true" aria-label="Site navigation">
                <div class="side-menu-header">
                    <h2>Menu</h2>
                    <button id="close-btn" class="close-btn" aria-label="Close menu">✕</button>
                </div>
                <ul class="side-menu-list">
                    <li><a href="${basePath}pages/profile.html"><img src="${basePath}assets/icons/profile.png" alt="" class="menu-icon"> Profile</a></li>
                    <li><a href="${basePath}pages/upload.html"><img src="${basePath}assets/icons/upload.png" alt="" class="menu-icon"> Upload</a></li>
                    <li><a href="${basePath}pages/settings.html"><img src="${basePath}assets/icons/settings.png" alt="" class="menu-icon"> Settings</a></li>
                </ul>
            </aside>
        `;
    }

    _attachListeners() {
        const sideMenu = this.querySelector('#side-menu');
        const closeBtn = this.querySelector('#close-btn');

        // Bound reference so the same function can be removed in disconnectedCallback
        this._handleDocumentClick = (e) => {
            const clickedMenuBtn = e.target.closest('.menu-btn, #menu-btn');
            const clickedOutside = !e.target.closest('#side-menu') && !clickedMenuBtn;

            if (clickedMenuBtn) {
                // Do NOT call e.preventDefault() here — it would block any
                // default behaviour on the trigger button (e.g. a link styled as a button)
                sideMenu.classList.add('open');
                sideMenu.setAttribute('aria-hidden', 'false');
                closeBtn.focus();
                return;
            }

            if (clickedOutside && sideMenu.classList.contains('open')) {
                this._close(sideMenu);
            }
        };

        document.addEventListener('click', this._handleDocumentClick);

        closeBtn.addEventListener('click', () => this._close(sideMenu));

        // Close on Escape key for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
                this._close(sideMenu);
            }
        });
    }

    _close(sideMenu) {
        sideMenu.classList.remove('open');
        sideMenu.setAttribute('aria-hidden', 'true');
    }
}

if (!customElements.get('side-menu-component')) {
    customElements.define('side-menu-component', SideMenuComponent);
}

// Works whether the script loads before or after DOMContentLoaded
function appendSideMenu() {
    if (!document.querySelector('side-menu-component')) {
        document.body.appendChild(document.createElement('side-menu-component'));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendSideMenu);
} else {
    appendSideMenu();
}
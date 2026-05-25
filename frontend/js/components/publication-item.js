class PublicationItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        const subtitle = this.getAttribute('subtitle') || artist;
        const stats = this.getAttribute('stats') || '';
        const showMenu = this.hasAttribute('show-menu');
        
        this.innerHTML = `
            <div class="publication-item publication-item-wrap" data-song-id="${songId}">
                <a href="/pages/song.html?id=${songId}" class="publication-link" style="text-decoration: none; color: inherit; display: flex; flex: 1; min-width: 0;">
                    ${this.getAttribute('image') ? `<img class="pub-thumb" src="${this.getAttribute('image')}" alt="cover">` : `<div class="pub-icon">🎵</div>`}
                    <div class="pub-info">
                        <h4>${title}</h4>
                        <p>${subtitle}</p>
                    </div>
                </a>
                ${stats ? `<div class="pub-stats"><span style="color: #888; font-size: 12px;">${stats}</span></div>` : ''}
                ${showMenu ? `
                    <div class="pub-actions">
                        <button type="button" class="pub-more" aria-label="Open publication actions">⋮</button>
                        <div class="pub-menu" hidden>
                            <button type="button" class="pub-menu-item pub-menu-delete" data-action="delete">Delete</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        if (showMenu) {
            const moreButton = this.querySelector('.pub-more');
            const menu = this.querySelector('.pub-menu');
            const deleteButton = this.querySelector('.pub-menu-delete');

            const closeMenu = () => {
                if (menu) menu.hidden = true;
            };

            moreButton?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (menu) {
                    menu.hidden = !menu.hidden;
                }
            });

            deleteButton?.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                closeMenu();
                this.dispatchEvent(new CustomEvent('publication-delete', {
                    bubbles: true,
                    detail: { songId, title, artist },
                }));
            });

            // Attach a scoped click handler so we can remove it on disconnect
            this._boundDocClick = (event) => {
                if (!this.contains(event.target)) {
                    closeMenu();
                }
            };

            document.addEventListener('click', this._boundDocClick);

            // Clean up when element is removed
            const observer = new MutationObserver(() => {
                if (!document.body.contains(this)) {
                    document.removeEventListener('click', this._boundDocClick);
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
}
customElements.define('publication-item', PublicationItemComponent);

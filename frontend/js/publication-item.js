class PublicationItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : './pages/';
        
        this.innerHTML = `
            <a href="${pagesPath}song.html?id=${songId}" class="publication-item" style="text-decoration: none; color: inherit; display: flex;">
                <div class="pub-icon">🎵</div>
                <div class="pub-info">
                    <h4>${title}</h4>
                    <p>${artist}</p>
                </div>
            </a>
        `;
    }
}
customElements.define('publication-item', PublicationItemComponent);

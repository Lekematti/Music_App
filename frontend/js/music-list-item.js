class MusicListItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : './pages/';
        
        this.innerHTML = `
            <a href="${pagesPath}song.html?id=${songId}" class="list-item" style="text-decoration: none; color: inherit; display: flex;">
                <div class="item-icon">🎵</div>
                <div class="item-info">
                    <h4 style="margin: 0; font-size: 14px;">${title}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">${artist}</p>
                </div>
            </a>
        `;
    }
}

customElements.define('music-list-item', MusicListItemComponent);

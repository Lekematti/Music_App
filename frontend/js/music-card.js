class MusicCardComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        
        // Resolve paths depending on if we are in /pages/ or in root
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : './pages/';
        
        this.innerHTML = `
            <a href="${pagesPath}song.html?id=${songId}" class="card" style="text-decoration: none; color: inherit;">
                <div class="card-icon">🎵</div>
                <h3>${title}</h3>
                <p>${artist}</p>
                <star-rating score="5"></star-rating>
            </a>
        `;
    }
}

customElements.define('music-card', MusicCardComponent);

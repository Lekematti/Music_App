class MusicCardComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        const image = this.getAttribute('image') || '';
        
        // Resolve paths depending on if we are in /pages/ or in root
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : './pages/';
        
        const hasCoverClass = image ? ' has-cover' : '';
        this.innerHTML = `
            <a href="${pagesPath}song.html?id=${songId}" class="card${hasCoverClass}" style="text-decoration: none; color: inherit;">
                ${image ? `<img class="card-cover media-cover" src="${image}" alt="cover" loading="lazy">` : `<div class="card-icon">🎵</div>`}
                <div class="card-body">
                  <h3>${title}</h3>
                  <p>${artist}</p>
                </div>
                <star-rating score="5"></star-rating>
            </a>
        `;
    }
}

customElements.define('music-card', MusicCardComponent);

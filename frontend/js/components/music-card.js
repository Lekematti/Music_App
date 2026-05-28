class MusicCardComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        const image = this.getAttribute('image') || '';
        const score = this.getAttribute('score') || '0';
        
        const hasCoverClass = image ? ' has-cover' : '';
        this.innerHTML = `
            <a href="/pages/song.html?id=${songId}" class="card${hasCoverClass}" style="text-decoration: none; color: inherit;">
                ${image ? `<img class="card-cover media-cover" src="${image}" alt="cover" loading="lazy">` : `<div class="card-icon">🎵</div>`}
                <div class="card-body">
                  <h3>${title}</h3>
                  <p>${artist}</p>
                </div>
                <div class="music-card-rating" style="margin-left: auto; flex-shrink: 0;">
                    <star-rating score="${score}"></star-rating>
                </div>
            </a>
        `;
    }
}

if (!customElements.get('music-card')) {
    customElements.define('music-card', MusicCardComponent);
}

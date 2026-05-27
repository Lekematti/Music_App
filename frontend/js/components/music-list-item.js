class MusicListItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const songId = this.getAttribute('song-id') || '1';
        const image = this.getAttribute('image') || '';
        const score = this.getAttribute('score') || '0';
        
        this.innerHTML = `
            <a href="/pages/song.html?id=${songId}" class="list-item" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                ${image ? `<img class="media-cover" src="${image}" alt="cover" loading="lazy">` : `<div class="item-icon">🎵</div>`}
                <div class="item-info">
                    <h4 style="margin: 0; font-size: 14px;">${title}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">${artist}</p>
                </div>
                <div style="margin-left: auto;">
                    <star-rating score="${score}"></star-rating>
                </div>
            </a>
        `;
    }
}

if (!customElements.get('music-list-item')) {
    customElements.define('music-list-item', MusicListItemComponent);
}

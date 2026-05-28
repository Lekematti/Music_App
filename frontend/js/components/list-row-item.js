class ListRowItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const rank = this.getAttribute('rank') || '1.';
        const songId = this.getAttribute('song-id') || '1';
        const score = this.getAttribute('score') || '5';
        const image = this.getAttribute('image') || '';
        
        this.innerHTML = `
            <a href="/pages/song.html?id=${songId}" class="list-row" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                <span class="row-number">${rank}</span>
                ${image ? `<img class="media-cover" src="${image}" alt="cover" loading="lazy">` : `<div class="item-icon">🎵</div>`}
                <div class="item-info" style="flex: 1; min-width: 0;">
                    <h4 style="margin: 0;">${title}</h4>
                    <p style="margin: 5px 0 0 0; color: #aaa;">${artist}</p>
                </div>
                <div class="music-card-rating" style="margin-left: auto; flex-shrink: 0;">
                    <star-rating score="${score}"></star-rating>
                </div>
            </a>
        `;
    }
}
if (!customElements.get('list-row-item')) {
    customElements.define('list-row-item', ListRowItemComponent);
}

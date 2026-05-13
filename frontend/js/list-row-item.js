class ListRowItemComponent extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Song Name';
        const artist = this.getAttribute('artist') || 'Artist';
        const rank = this.getAttribute('rank') || '1.';
        const songId = this.getAttribute('song-id') || '1';
        const score = this.getAttribute('score') || '5';
        
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const pagesPath = isPagesDir ? './' : './pages/';
        
        this.innerHTML = `
            <a href="${pagesPath}song.html?id=${songId}" class="list-row" style="text-decoration: none; color: inherit;">
                <span class="row-number">${rank}</span>
                <div class="item-icon">🎵</div>
                <div class="item-info">
                    <h4>${title}</h4>
                    <p>${artist}</p>
                </div>
                <star-rating score="${score}"></star-rating>
            </a>
        `;
    }
}
customElements.define('list-row-item', ListRowItemComponent);

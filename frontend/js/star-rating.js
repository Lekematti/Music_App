class StarRatingComponent extends HTMLElement {
    connectedCallback() {
        const score = parseInt(this.getAttribute('score')) || 5;
        const isPagesDir = globalThis.location.pathname.includes('/pages/');
        const basePath = isPagesDir ? '../' : './';
        
        let starsSvg = '';
        for(let i=0; i<score; i++) {
            starsSvg += `<img src="${basePath}assets/icons/star.png" alt="Star">`;
        }
        
        this.innerHTML = `<div class="stars">${starsSvg}</div>`;
    }
}
customElements.define('star-rating', StarRatingComponent);

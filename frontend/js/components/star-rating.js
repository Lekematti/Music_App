class StarRatingComponent extends HTMLElement {
    connectedCallback() {
        const score = Number.parseInt(this.getAttribute('score')) || 5;
        const basePath = '/';
        
        let starsSvg = '';
        for(let i=0; i<score; i++) {
            starsSvg += `<img src="${basePath}assets/icons/star.png" alt="Star">`;
        }
        
        this.innerHTML = `<div class="stars">${starsSvg}</div>`;
    }
}
customElements.define('star-rating', StarRatingComponent);

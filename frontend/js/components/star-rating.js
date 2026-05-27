class StarRatingComponent extends HTMLElement {
    connectedCallback() {
        const rawScore = this.getAttribute('score');
        const score = rawScore === null ? 5 : Number.parseFloat(rawScore);
        // Round to nearest 0.5
        const roundedScore = Math.round(score * 2) / 2;
        const maxStars = 5;
        const basePath = '/';
        
        let starsSvg = '';
        for(let i = 1; i <= maxStars; i++) {
            if (roundedScore >= i) {
                starsSvg += `<img src="${basePath}assets/icons/star.png" alt="Star" style="opacity: 1;">`;
            } else if (roundedScore >= i - 0.5) {
                starsSvg += `<img src="${basePath}assets/icons/half_star.png" alt="Half Star" style="opacity: 1;">`;
            } else {
                starsSvg += `<img src="${basePath}assets/icons/star.png" alt="Empty Star" style="opacity: 0.2;">`;
            }
        }
        
        this.innerHTML = `<div class="stars">${starsSvg}</div>`;
    }
}
if (!customElements.get('star-rating')) {
    customElements.define('star-rating', StarRatingComponent);
}

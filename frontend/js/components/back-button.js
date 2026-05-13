class BackButtonComponent extends HTMLElement {
    connectedCallback() {
        // Find if any specific inline styles are provided, otherwise default to list/top pages margin
        const defaultMargin = this.getAttribute('margin-bottom') || '0';
        this.innerHTML = `<button onclick="window.history.back();" class="back-link" style="background: none; border: none; padding: 0; cursor: pointer; color: inherit; font: inherit; text-decoration: underline; margin-bottom: ${defaultMargin}; display: inline-block;">← Back</button>`;
    }
}
customElements.define('back-button', BackButtonComponent);

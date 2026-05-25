class BackButtonComponent extends HTMLElement {
    connectedCallback() {
        const defaultMargin = this.getAttribute('margin-bottom') || '0';
        this.innerHTML = `<a href="../index.html" class="back-link" style="background: none; border: none; padding: 0; cursor: pointer; color: inherit; font: inherit; text-decoration: underline; margin-bottom: ${defaultMargin}; display: inline-block;">← Back</a>`;
    }
}
customElements.define('back-button', BackButtonComponent);

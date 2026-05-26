class BackButtonComponent extends HTMLElement {
    connectedCallback() {
        const defaultMargin = this.getAttribute('margin-bottom') || '0';
        this.innerHTML = `<a href="../index.html" class="back-link" style="background: none; border: none; padding: 0; cursor: pointer; color: inherit; font: inherit; text-decoration: underline; margin-bottom: ${defaultMargin}; display: inline-block;">← Back</a>`;

        const link = this.querySelector('.back-link');
        if (link) {
            link.addEventListener('click', (ev) => {
                ev.preventDefault();
                // Prefer SPA navigation to keep the global player alive
                if (globalThis.appRouter && typeof globalThis.appRouter.navigateTo === 'function') {
                    globalThis.appRouter.navigateTo('/index.html');
                    return;
                }

                // Fallback to history.back() which may preserve state better than full reload
                try {
                    history.back();
                } catch (e) {
                    console.error('Navigation fallback triggered:', e);
                    globalThis.location.href = '/index.html';
                }
            });
        }
    }
}
if (!customElements.get('back-button')) {
    customElements.define('back-button', BackButtonComponent);
}

class AudioPlayerComponent extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['src'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src' && oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const src = this.getAttribute('src') || '';
        this.innerHTML = `
            <div class="player-wrapper" style="padding: 30px; background: #0d0e12; border: 1px solid #2a2a2a; border-radius: 8px; margin: 20px 0; text-align: center;">
                ${src ? `
                    <audio controls style="width: 100%; outline: none;" src="${src}">
                        Your browser does not support the audio element.
                    </audio>
                ` : `
                    <p style="color: #666; font-size: 14px; font-style: italic;">No audio URL available for this song.</p>
                `}
            </div>
        `;
    }
}

customElements.define('audio-player-component', AudioPlayerComponent);

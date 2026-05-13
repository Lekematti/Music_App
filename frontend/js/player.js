class AudioPlayerComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="player-mock" style="padding: 30px; background: #0d0e12; border: 1px solid #2a2a2a; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="color: #666; margin-bottom: 20px; font-size: 14px;">[ MOCK AUDIO PLAYER ]</p>

                <!-- Mock progress bar -->
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                    <span style="color: #888; font-size: 12px;">0:00</span>
                    <div style="flex-grow: 1; height: 6px; background: #2a2a2a; border-radius: 3px; position: relative;">
                        <div style="position: absolute; left: 0; top: 0; height: 100%; width: 25%; background: white; border-radius: 3px;"></div>
                    </div>
                    <span style="color: #888; font-size: 12px;">3:45</span>
                </div>

                <!-- Play controls -->
                <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
                    <button style="background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer;">⏮</button>
                    <button class="mock-play-btn" style="background: white; color: black; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">▶</button>
                    <button style="background: none; border: none; color: #aaa; font-size: 20px; cursor: pointer;">⏭</button>
                </div>
            </div>
        `;
    }
}

customElements.define('audio-player-component', AudioPlayerComponent);

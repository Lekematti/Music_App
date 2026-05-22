class AudioPlayerComponent extends HTMLElement {
    connectedCallback() {
        this.render();
        this.bindEvents();
    }

    disconnectedCallback() {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }

    static get observedAttributes() {
        return ['src'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'src' && oldValue !== newValue) {
            this.render();
            this.bindEvents();
        }
    }

    render() {
        const src = this.getAttribute('src') || '';
        const image = this.getAttribute('image') || '';
        this.innerHTML = `
            <div class="player-wrapper" style="padding: 24px; background: #0d0e12; border: 1px solid #2a2a2a; border-radius: 8px; margin: 20px 0; text-align: center;">
                ${src ? `
                    <audio class="player-audio" preload="auto"></audio>
                    <div class="player-meta" style="margin-bottom: 18px; display:flex; align-items:center; gap:12px; justify-content:center;">
                        ${image ? `<img class="player-cover" src="${image}" alt="cover" loading="lazy" style="width:96px;height:96px;object-fit:contain;border-radius:8px;">` : ''}
                        <p class="player-status" style="color: #666; margin: 0; font-size: 14px;">Loading audio...</p>
                    </div>

                    <div class="player-seek-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <span class="player-current-time" style="color: #888; font-size: 12px; min-width: 42px; text-align: left;">0:00</span>
                        <div class="player-progress" role="slider" aria-label="Seek audio position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0" style="flex: 1; height: 12px; display: flex; align-items: center; cursor: pointer;">
                            <div class="player-track" style="position: relative; width: 100%; height: 4px; background: #2a2a2a; border-radius: 999px; overflow: hidden;">
                                <div class="player-fill" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #fff; border-radius: 999px;"></div>
                            </div>
                        </div>
                        <span class="player-duration" style="color: #888; font-size: 12px; min-width: 42px; text-align: right;">0:00</span>
                    </div>

                    <div style="display: flex; justify-content: center; align-items: center; gap: 16px;">
                        <button type="button" class="player-skip-back" aria-label="Skip back 10 seconds" style="background: none; border: none; color: #aaa; font-size: 16px; cursor: pointer;">⏪ 10s</button>
                        <button type="button" class="player-toggle" style="background: white; color: black; border: none; border-radius: 50%; width: 58px; height: 58px; font-size: 22px; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">▶</button>
                        <button type="button" class="player-skip-forward" aria-label="Skip forward 10 seconds" style="background: none; border: none; color: #aaa; font-size: 16px; cursor: pointer;">10s ⏩</button>
                    </div>
                ` : `
                    <p style="color: #666; font-size: 14px; font-style: italic;">No audio URL available for this song.</p>
                `}
            </div>
        `;
    }

    bindEvents() {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }

        this.audio = this.querySelector('.player-audio');
        this.progress = this.querySelector('.player-progress');
        this.fill = this.querySelector('.player-fill');
        this.toggleButton = this.querySelector('.player-toggle');
        this.currentTimeLabel = this.querySelector('.player-current-time');
        this.durationLabel = this.querySelector('.player-duration');
        this.statusLabel = this.querySelector('.player-status');
        // no cover handling in player; image is shown on the song card

        if (!this.audio || !this.progress || !this.toggleButton) {
            return;
        }

        const formatTime = (seconds) => {
            if (!Number.isFinite(seconds)) {
                return '0:00';
            }

            const totalSeconds = Math.max(0, Math.floor(seconds));
            const minutes = Math.floor(totalSeconds / 60);
            const remainingSeconds = totalSeconds % 60;
            return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
        };

        const syncProgress = () => {
            const duration = this.audio.duration || 0;
            const currentTime = this.audio.currentTime || 0;
            const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

            if (this.currentTimeLabel) {
                this.currentTimeLabel.textContent = formatTime(currentTime);
            }

            if (this.durationLabel) {
                this.durationLabel.textContent = formatTime(duration);
            }

            if (this.fill) {
                this.fill.style.width = `${progressPercent}%`;
            }

            if (this.progress) {
                this.progress.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
            }
        };

        const updateToggleIcon = () => {
            this.toggleButton.textContent = this.audio.paused ? '▶' : '❚❚';
            if (this.statusLabel) {
                this.statusLabel.textContent = this.audio.paused ? 'Paused' : 'Playing';
            }
        };

        const loadSource = async () => {
            const src = this.getAttribute('src') || '';

            if (!src) {
                return;
            }

            try {
                if (this.statusLabel) {
                    this.statusLabel.textContent = 'Loading audio...';
                }

                const response = await fetch(src);

                if (!response.ok) {
                    throw new Error(`Failed to load audio (${response.status})`);
                }

                const blob = await response.blob();
                this.objectUrl = URL.createObjectURL(blob);
                this.audio.src = this.objectUrl;
                syncProgress();
                updateToggleIcon();
            } catch (error) {
                console.error('Unable to load audio source:', error);
                if (this.statusLabel) {
                    this.statusLabel.textContent = 'Failed to load audio';
                }
            }
        };

        // image handling removed from player — song card displays the cover

        this.audio.addEventListener('loadedmetadata', syncProgress);
        this.audio.addEventListener('timeupdate', syncProgress);
        this.audio.addEventListener('play', updateToggleIcon);
        this.audio.addEventListener('pause', updateToggleIcon);
        this.audio.addEventListener('ended', () => {
            syncProgress();
            this.toggleButton.textContent = '▶';
            if (this.statusLabel) {
                this.statusLabel.textContent = 'Finished';
            }
        });

        this.toggleButton.addEventListener('click', async () => {
            if (this.audio.paused) {
                try {
                    await this.audio.play();
                } catch (error) {
                    console.error('Unable to play audio:', error);
                }
            } else {
                this.audio.pause();
            }
        });

        const seekToEvent = (event) => {
            const duration = this.audio.duration || 0;
            if (!duration || !this.progress) {
                return;
            }

            const rect = this.progress.getBoundingClientRect();
            const clientX = typeof event.clientX === 'number' ? event.clientX : rect.left;
            const offset = Math.min(Math.max(clientX - rect.left, 0), rect.width);
            const ratio = rect.width > 0 ? offset / rect.width : 0;
            const nextTime = ratio * duration;

            this.audio.currentTime = nextTime;
            syncProgress();
        };

        let isScrubbing = false;

        this.progress.addEventListener('pointerdown', (event) => {
            isScrubbing = true;
            this.progress.setPointerCapture?.(event.pointerId);
            seekToEvent(event);
        });

        this.progress.addEventListener('pointermove', (event) => {
            if (!isScrubbing) {
                return;
            }

            seekToEvent(event);
        });

        const stopScrubbing = () => {
            isScrubbing = false;
        };

        this.progress.addEventListener('pointerup', stopScrubbing);
        this.progress.addEventListener('pointercancel', stopScrubbing);
        window.addEventListener('pointerup', stopScrubbing, { once: true });

        this.progress.addEventListener('keydown', (event) => {
            const duration = this.audio.duration || 0;
            if (!duration) {
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                this.audio.currentTime = Math.min(duration, (this.audio.currentTime || 0) + 5);
                syncProgress();
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                this.audio.currentTime = Math.max(0, (this.audio.currentTime || 0) - 5);
                syncProgress();
            }
        });

        this.querySelector('.player-skip-back')?.addEventListener('click', () => {
            this.audio.currentTime = Math.max(0, (this.audio.currentTime || 0) - 10);
            syncProgress();
        });

        this.querySelector('.player-skip-forward')?.addEventListener('click', () => {
            const duration = this.audio.duration || 0;
            this.audio.currentTime = Math.min(duration || Infinity, (this.audio.currentTime || 0) + 10);
            syncProgress();
        });

        loadSource();
        syncProgress();
        updateToggleIcon();
    }
}

customElements.define('audio-player-component', AudioPlayerComponent);

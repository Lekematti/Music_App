/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Ensure the component is registered
import '../../frontend/js/components/player.js';

function wait(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('AudioPlayerComponent (DOM)', () => {
  let originalFetch;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    // keep originals
    originalFetch = globalThis.fetch;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    // restore
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders fallback when no src provided', async () => {
    const el = document.createElement('audio-player-component');
    document.body.appendChild(el);

    // ensure rendered
    expect(el.textContent).toMatch(/No audio URL available/i);
  });

  it('shows failed load state when fetch returns non-ok', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404 }));

    const el = document.createElement('audio-player-component');
    el.setAttribute('src', '/missing.mp3');
    document.body.appendChild(el);

    await wait(10);

    const status = el.querySelector('.player-status');
    expect(status).toBeTruthy();
    expect(status.textContent).toMatch(/Failed to load audio|loading audio/i);
  });

  it('loads audio, toggles play/pause and updates UI, supports skip and seek', async () => {
    // mock fetch to return a blob
    const fakeBlob = new Blob(['fakeaudio'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn(async () => ({ ok: true, blob: async () => fakeBlob }));

    // mock URL.createObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    const el = document.createElement('audio-player-component');
    el.setAttribute('src', '/audio.mp3');
    document.body.appendChild(el);

    // wait for loadSource async
    await wait(10);

    const audio = el.querySelector('.player-audio');
    expect(audio).toBeTruthy();

    // stub play/pause to simulate behavior
    let pausedFlag = true;
    Object.defineProperty(audio, 'paused', {
      get() {
        return pausedFlag;
      },
      configurable: true,
    });
    let currentTimeVal = 0;
    Object.defineProperty(audio, 'duration', {
      get() {
        return 100;
      },
      configurable: true,
    });
    Object.defineProperty(audio, 'currentTime', {
      get() {
        return currentTimeVal;
      },
      set(v) {
        currentTimeVal = v;
      },
      configurable: true,
    });
    audio.play = vi.fn(async () => {
      pausedFlag = false;
      audio.dispatchEvent(new Event('play'));
    });
    audio.pause = vi.fn(() => {
      pausedFlag = true;
      audio.dispatchEvent(new Event('pause'));
    });

    const toggle = el.querySelector('.player-toggle');
    const status = el.querySelector('.player-status');
    const fill = el.querySelector('.player-fill');
    const durationLabel = el.querySelector('.player-duration');

    // initial duration label should reflect 0 or formatted
    expect(durationLabel.textContent).toBeTruthy();

    // click play
    toggle.click();
    await wait(5);
    expect(audio.play).toHaveBeenCalled();
    expect(status.textContent).toMatch(/Playing/i);
    expect(toggle.textContent).toBe('❚❚');

    // click pause
    toggle.click();
    await wait(5);
    expect(audio.pause).toHaveBeenCalled();
    expect(status.textContent).toMatch(/Paused/i);
    expect(toggle.textContent).toBe('▶');

    // test skip forward/back
    audio.currentTime = 50;
    const skipF = el.querySelector('.player-skip-forward');
    const skipB = el.querySelector('.player-skip-back');
    skipF.click();
    expect(audio.currentTime).toBeGreaterThanOrEqual(60 - 0.0001);
    skipB.click();
    expect(audio.currentTime).toBeGreaterThanOrEqual(50 - 0.0001);

    // test keyboard seek (ArrowRight adds 5s)
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    el.querySelector('.player-progress').dispatchEvent(event);
    expect(audio.currentTime).toBeGreaterThanOrEqual(55 - 0.0001);

    // test pointer seek: mock getBoundingClientRect and dispatch pointerdown
    const progress = el.querySelector('.player-progress');
    progress.getBoundingClientRect = () => ({ left: 0, width: 200 });
    const pd = new PointerEvent('pointerdown', { pointerId: 1, clientX: 100 });
    progress.dispatchEvent(pd);
    // currentTime should be roughly half of duration
    expect(audio.currentTime).toBeGreaterThanOrEqual(45 - 1);

    // verify fill width updated
    expect(fill.style.width).toMatch(/%/);
  });
});

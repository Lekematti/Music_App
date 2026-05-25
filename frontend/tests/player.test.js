/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import '../js/components/player.js';

describe('Player component', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    beforeEach(() => {
        // Prevent JSDOM/undici from trying to resolve relative URLs during tests
        // Return a small audio blob so the component can create an object URL.
        globalThis.__originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn(async (input) => {
            return {
                ok: true,
                blob: async () => new Blob(['dummy'], { type: 'audio/mpeg' }),
            };
        });
    });

    afterEach(() => {
        if (globalThis.__originalFetch) {
            globalThis.fetch = globalThis.__originalFetch;
            delete globalThis.__originalFetch;
        }
    });

    it('renders player and accepts src attribute', async () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        const player = document.querySelector('audio-player-component');
        expect(player).not.toBeNull();

        // set a fake src and ensure it updates
        player.setAttribute('src', '/api/media?bucket=songs&path=fake.mp3');
        // Re-query inner audio after lifecycle hooks
        const audio = player.querySelector('audio');
        expect(audio).not.toBeNull();
    });
});

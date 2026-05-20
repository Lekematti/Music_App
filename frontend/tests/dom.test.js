/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Import components to register them in JSDOM
import '../js/components/music-card.js';
// (Assuming these exist, but we can stick to testing the overall DOM and known elements)

describe('Navigation and DOM Component tests', () => {

    beforeEach(() => {
        // Reset DOM before each test
        document.body.innerHTML = '';
        if (globalThis.location) {
            globalThis.location.pathname = '/';
        }
    });
    
    it('Index page should contain dynamic containers for songs', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        document.body.innerHTML = html;

        const top10Widget = document.getElementById('top10-widget');
        const pastUploadsWidget = document.getElementById('past-uploads-widget');
        const newUploadsList = document.getElementById('new-uploads-list');

        expect(top10Widget).not.toBeNull();
        expect(pastUploadsWidget).not.toBeNull();
        expect(newUploadsList).not.toBeNull();
    });

    it('Music card component should correctly render attributes', () => {
        const card = document.createElement('music-card');
        card.setAttribute('title', 'Test Song');
        card.setAttribute('artist', 'Test Artist');
        card.setAttribute('song-id', '42');
        document.body.appendChild(card);

        const titleHeader = card.querySelector('h3');
        const artistEl = card.querySelector('p');
        const anchor = card.querySelector('a');

        expect(titleHeader.textContent).toBe('Test Song');
        expect(artistEl.textContent).toBe('Test Artist');
        expect(anchor.getAttribute('href')).toContain('id=42');
    });

    it('Song page should have correct audio player structure', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        // Either standard audio tag, or your custom element if defined
        const audio = document.querySelector('audio');
        const customPlayer = document.querySelector('audio-player-component');
        
        expect(audio || customPlayer).not.toBeNull();
    });
});

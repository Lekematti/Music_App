/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Import components to register them in JSDOM
import '../js/components/music-card.js';
import '../js/components/top-bar.js';
import '../js/components/back-button.js';
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

    it('Song page should render song metadata with the persistent player', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        const title = document.querySelector('#song-title');
        const artist = document.querySelector('#song-artist');
        const customPlayer = document.querySelector('#global-player');

        expect(title).not.toBeNull();
        expect(artist).not.toBeNull();
        expect(customPlayer).not.toBeNull();
    });

    it('Back button on song page points to the home page', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        const backLink = document.querySelector('back-button .back-link');

        expect(backLink).not.toBeNull();
        expect(backLink.getAttribute('href')).toBe('../index.html');
    });

    it('Top bar search form points to the search page and preserves the query', () => {
        globalThis.history.pushState({}, '', '/?q=summer');

        document.body.innerHTML = '<top-bar-component></top-bar-component>';

        const form = document.querySelector('.search-bar');
        const input = document.querySelector('.search-bar input[name="q"]');

        expect(form.getAttribute('action')).toContain('pages/search.html');
        expect(input.getAttribute('value')).toBe('summer');
    });

    it('Top bar shows live search suggestions for matching songs', async () => {
        const mockFetch = vi.fn(async () => ({
            ok: true,
            json: async () => ([
                { id: '1', title: 'Summer Nights', artist: 'Midnight Echo' },
                { id: '2', title: 'Summer Rain', artist: 'Blue Lane' },
            ]),
        }));

        globalThis.fetch = mockFetch;
        document.body.innerHTML = '<top-bar-component></top-bar-component>';

        const input = document.querySelector('.search-bar input[name="q"]');
        input.value = 'summer';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise((resolve) => globalThis.setTimeout(resolve, 250));

        const suggestions = document.querySelectorAll('.search-suggestion-item');
        expect(mockFetch).toHaveBeenCalledWith('/api/songs?search=summer');
        expect(suggestions.length).toBe(2);
        expect(suggestions[0].getAttribute('href')).toContain('pages/song.html?id=1');
    });
});

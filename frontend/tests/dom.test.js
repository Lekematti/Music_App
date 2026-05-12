/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation and DOM structure tests', () => {
    
    it('Index page should contain featured song links', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        document.body.innerHTML = html;

        const songLinks = document.querySelectorAll('a[href^="./pages/song.html"]');
        expect(songLinks.length).toBeGreaterThan(0);
    });

    it('Subpages should contain a working back button', () => {
        const newUploadsPath = path.resolve(__dirname, '../pages/new-uploads.html');
        const html = fs.readFileSync(newUploadsPath, 'utf-8');
        document.body.innerHTML = html;

        const backBtn = document.querySelector('button.back-link');
        expect(backBtn).not.toBeNull();
        expect(backBtn.getAttribute('onclick')).toContain('window.history.back()');
    });

    it('Song page should have correct audio player structure', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        const mockPlayBtn = document.getElementById('mock-play-btn');
        expect(mockPlayBtn).not.toBeNull();
        expect(mockPlayBtn.textContent).toBe('▶');
    });
});

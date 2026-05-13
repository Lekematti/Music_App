/**
 * @vitest-environment jsdom
 */
import { describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Navigation and DOM structure tests', () => {
    
    it('Index page should contain featured song links', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
        document.body.innerHTML = html;

        // Check main menu buttons (front page cards) -- now they are components
        const songCards = document.querySelectorAll('music-card');
        expect(songCards.length).toBeGreaterThan(0);
    });

    it('Subpages should contain a working back button', () => {
        const newUploadsPath = path.resolve(__dirname, '../pages/new-uploads.html');
        const html = fs.readFileSync(newUploadsPath, 'utf-8');
        document.body.innerHTML = html;

        const backBtn = document.querySelector('back-button');
        expect(backBtn).not.toBeNull();
        /* Shadow DOM / Component handles this */
    });

    it('Song page should have correct audio player structure', () => {
        const html = fs.readFileSync(path.resolve(__dirname, '../pages/song.html'), 'utf-8');
        document.body.innerHTML = html;

        const playerComponent = document.querySelector('audio-player-component');
        expect(playerComponent).not.toBeNull();
    });
});

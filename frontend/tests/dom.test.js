/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('frontend: DOM utilities / test simulation', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="test-container">
                <p id="greeting">Test</p>
            </div>
        `;
    });

    it('Should find an element in the DOM', () => {
        const pElement = document.getElementById('greeting');
        expect(pElement).not.toBeNull();
        expect(pElement.textContent).toBe('Test');
    });

    it('Should update the text content of a DOM element', () => {
        const pElement = document.getElementById('greeting');
        pElement.textContent = 'Test text';
        expect(document.getElementById('greeting').textContent).toBe('Test text');
    });
});

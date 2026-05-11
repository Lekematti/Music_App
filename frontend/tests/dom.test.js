/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Frontend: DOM apufunktiot / testisimulaatio', () => {
    beforeEach(() => {
        // Alustetaan DOM-elementti ennen jokaista testiä (simuloidaan selainta)
        document.body.innerHTML = `
            <div id="test-container">
                <p id="greeting">Hei maailma!</p>
            </div>
        `;
    });

    it('Pitäisi löytää elementti DOM:ista', () => {
        const pElement = document.getElementById('greeting');
        expect(pElement).not.toBeNull();
        expect(pElement.textContent).toBe('Hei maailma!');
    });

    it('Pitäisi päivittää DOM-elementin tekstiä', () => {
        const pElement = document.getElementById('greeting');
        pElement.textContent = 'Moikka!';
        expect(document.getElementById('greeting').textContent).toBe('Moikka!');
    });
});

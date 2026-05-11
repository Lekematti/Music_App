import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    // Määritellään, että käytetään jsdomia DOM-simulaatioon (tämä on oletus, jos testitiedostossa tai kansioissa on DOM-koodia),
    // mutta voimme jättää ympäristöksi 'node' ja yliajaa sen asettamalla /* @vitest-environment jsdom */ testitiedoston yläreunaan, 
    // tai muuttaa globaalisti riippuen strategiasta. Laitetaan globaaliksi, tai workspace-pohjaiseksi.
    // Tässä yksinkertaisuuden vuoksi käytetään 'jsdom' ympäristöä joka paikassa, tai poistetaan asetus.
    environment: 'node',
  },
});

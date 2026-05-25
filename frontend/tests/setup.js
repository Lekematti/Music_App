// Frontend test setup — stub global fetch for jsdom tests
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = (input, init) => {
    return Promise.resolve({
      ok: true,
      blob: async () => new Blob([''], { type: 'audio/mpeg' }),
      arrayBuffer: async () => new ArrayBuffer(0),
      json: async () => ({}),
      text: async () => '',
    });
  };
}

// Provide a helpful global in tests
globalThis.TEST_ENV = globalThis.TEST_ENV || 'jsdom';

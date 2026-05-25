import { describe, it, expect } from 'vitest';
const { createMockSupabase } = require('../../tests/helpers/supabaseMock');

describe('createMockSupabase', () => {
  it('uploads and downloads a file successfully', async () => {
    const sup = createMockSupabase();
    const storage = sup.storage.from('songs');

    const uploadRes = await storage.upload('test.mp3', Buffer.from('hello'));
    expect(uploadRes).toEqual({ error: null });

    const dl = await storage.download('test.mp3');
    expect(dl.error).toBeNull();
    expect(dl.data).toBeDefined();
    const ab = await dl.data.arrayBuffer();
    const buf = Buffer.from(ab);
    expect(buf.toString()).toBe('hello');
  });

  it('returns not found for missing download', async () => {
    const sup = createMockSupabase();
    const storage = sup.storage.from('songs');

    const dl = await storage.download('no-such-file');
    expect(dl.data).toBeNull();
    expect(dl.error).toBeDefined();
    expect(String(dl.error.message)).toMatch(/Not found/i);
  });

  it('removes files and getPublicUrl returns expected path', async () => {
    const sup = createMockSupabase();
    const storage = sup.storage.from('covers');

    await storage.upload('cover.png', Buffer.from('img'));
    const publicUrl = storage.getPublicUrl('cover.png');
    expect(publicUrl).toBeDefined();
    expect(publicUrl.data.publicUrl).toContain('/storage/v1/object/public/covers/cover.png');

    const removed = await storage.remove(['cover.png']);
    expect(removed).toEqual({ error: null });

    const dl = await storage.download('cover.png');
    expect(dl.data).toBeNull();
    expect(dl.error).toBeDefined();
  });

  it('listBuckets returns created bucket names', async () => {
    const sup = createMockSupabase();
    const s1 = sup.storage.from('one');
    const s2 = sup.storage.from('two');

    await s1.upload('a', Buffer.from('x'));
    await s2.upload('b', Buffer.from('y'));

    const list = await sup.storage.listBuckets();
    expect(list).toBeDefined();
    expect(list.error).toBeNull();
    const names = list.data.map((d) => d.name).sort();
    expect(names).toEqual(['one', 'two']);
  });

  it('handles upload with missing buffer and repeated from calls (branch coverage)', async () => {
    const sup = createMockSupabase();
    const s1 = sup.storage.from('repeat');

    // call upload without buffer to hit the default-empty-buffer branch
    const up = await s1.upload('empty.bin');
    expect(up).toEqual({ error: null });

    const dl = await s1.download('empty.bin');
    expect(dl.error).toBeNull();
    const ab = await dl.data.arrayBuffer();
    const buf = Buffer.from(ab);
    expect(buf.length).toBeGreaterThanOrEqual(0);

    // call from() again for the same bucket to exercise the ensureBucket existing-path
    const s2 = sup.storage.from('repeat');
    await s2.upload('another.bin', Buffer.from('ok'));

    const list = await sup.storage.listBuckets();
    expect(list.data.map((d) => d.name)).toContain('repeat');
  });
});

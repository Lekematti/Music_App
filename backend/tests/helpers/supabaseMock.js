function createMockSupabase() {
  const buckets = new Map();

  function ensureBucket(name) {
    if (!buckets.has(name)) buckets.set(name, new Map());
    return buckets.get(name);
  }

  return {
    storage: {
      from(bucketName) {
        const bucket = ensureBucket(bucketName);
        return {
          async upload(path, buffer) {
            // store Buffer or Uint8Array
            bucket.set(path, Buffer.from(buffer || ''));
            return { error: null };
          },
          async download(path) {
            if (!bucket.has(path)) {
              return { data: null, error: { message: 'Not found' } };
            }
            const buf = bucket.get(path);
            return {
              data: {
                async arrayBuffer() {
                  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                },
              },
              error: null,
            };
          },
          async remove(paths) {
            for (const p of paths) bucket.delete(p);
            return { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucketName}/${path}` } };
          },
        };
      },
      async listBuckets() {
        return { data: Array.from(buckets.keys()).map((n) => ({ name: n })), error: null };
      },
    },
  };
}

module.exports = { createMockSupabase };

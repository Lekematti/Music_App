import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';

describe('Server start branch', () => {
  it('spawns node to require server as main and exits', (done) => {
    const script = path.join(__dirname, '..', '..', 'testStartServer.js');
    const child = spawn(process.execPath, [script], { stdio: 'ignore' });

    child.on('exit', (code) => {
      try {
        expect(code).toBe(0);
        done();
      } catch (e) {
        done(e);
      }
    });

    child.on('error', (err) => done(err));
  }, 5000);
});

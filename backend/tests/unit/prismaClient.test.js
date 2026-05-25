import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../prisma/prismaClient';

describe('prismaClient proxy', () => {
  let originalClient;

  beforeAll(() => {
    originalClient = typeof prisma.getClient === 'function' ? prisma.getClient() : prisma;
  });

  afterAll(() => {
    if (originalClient && typeof prisma.setClient === 'function') {
      prisma.setClient(originalClient);
    }
  });

  it('getClient and setClient work', () => {
    const fake = { foo: 'bar' };
    prisma.setClient(fake);
    expect(prisma.getClient()).toBe(fake);
  });

  it('get trap returns properties from current client', () => {
    const fake2 = { someMethod: () => 'ok', someProp: 42 };
    prisma.setClient(fake2);
    expect(prisma.someProp).toBe(42);
    expect(typeof prisma.someMethod).toBe('function');
    expect(prisma.someMethod()).toBe('ok');
  });

  it('set trap replaces client when assigning `client` property', () => {
    const another = { id: 'another' };
    prisma.client = another;
    expect(prisma.getClient()).toBe(another);
  });

  it('set trap sets properties on current client for non-client props', () => {
    const obj = {};
    prisma.setClient(obj);
    prisma.newProp = 'x';
    expect(prisma.getClient().newProp).toBe('x');
  });

  it('also works via Reflect.get and Reflect.set', () => {
    const r1 = {};
    const setFn = Reflect.get(prisma, 'setClient');
    setFn(r1);
    expect(Reflect.get(prisma, 'getClient')()).toBe(r1);

    const r2 = { idx: 7 };
    Reflect.set(prisma, 'client', r2);
    expect(prisma.getClient()).toBe(r2);

    const r3 = {};
    prisma.setClient(r3);
    Reflect.set(prisma, 'zProp', 'z');
    expect(prisma.getClient().zProp).toBe('z');
  });
});

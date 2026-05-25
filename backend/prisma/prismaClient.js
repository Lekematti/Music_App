const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

let current = new PrismaClient({ adapter });

function setClient(c) {
  current = c;
  // ensure helper functions are available on the client instance
  current.setClient = setClient;
  current.getClient = getClient;
}

function getClient() {
  return current;
}

const handler = {
  get(_, prop) {
    // always read from the underlying current client instance
    return Reflect.get(current, prop);
  },
  set(_, prop, value) {
    // allow replacing the client via property assignment if needed
    if (prop === 'client') {
      current = value;
      // ensure helper functions are available on the new client instance
      current.setClient = setClient;
      current.getClient = getClient;
      return true;
    }
    current[prop] = value;
    return true;
  },
};

const proxy = new Proxy({}, handler);

// expose helpers on the proxy so tests and callers can swap the underlying client
proxy.setClient = setClient;
proxy.getClient = getClient;

module.exports = proxy;

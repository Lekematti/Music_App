// Small helper to require the server as main and exit shortly after to exercise startup code in tests
require('./server');

// Allow a short window for the server to start, then exit
setTimeout(() => process.exit(0), 200);

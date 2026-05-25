const { createApp } = require('./appFactory');
// create default app using the real Prisma/Supabase client modules (they are replaceable/mutable)
const app = createApp();

// export factory as well for tests that want to create isolated apps
module.exports = app;
module.exports.createApp = createApp;

const app = require('./server');

// CLI entrypoint: start the server when invoked directly or when forced by env
if (require.main === module || process.env.FORCE_START === '1') {
  app.start();
}

module.exports = app;

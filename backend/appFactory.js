const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config();

function createApp({ prisma, supabase } = {}) {
  const app = express();
  app.disable("x-powered-by");
  const PORT = process.env.PORT || 5000;

  // Middleware
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : false,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // A test router mounted early so tests can register routes that run before static/fallback
  const testRouter = express.Router();
  app.use(testRouter);
  app.registerTestRoute = (method, path, handler) => {
    if (typeof testRouter[method] === "function") {
      testRouter[method](path, handler);
    }
  };

  // Allow routes to receive optional injected clients by setting them on process.env style
  // but most routes require the prisma client via require('./prisma/prismaClient') which is now replaceable.

  // Routes (API routes must come before static files)
  const authRoutes = require("./routes/authRoutes");
  const passwordResetRoutes = require("./routes/passwordResetRoutes");
  const songRoutes = require("./routes/songRoutes");
  const uploadRoutes = require("./routes/uploadRoutes");
  const uploadDiagnostics = require("./routes/uploadDiagnostics");
  const mediaRoutes = require("./routes/mediaRoutes");

  app.use("/api/auth", authRoutes);
  app.use("/api/auth", passwordResetRoutes);
  app.use("/api/songs", songRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/uploads/diagnostics", uploadDiagnostics);
  app.use("/api/media", mediaRoutes);

  // If a supabase client is injected, set it on route modules that accept it
  if (supabase) {
    [songRoutes, uploadRoutes, uploadDiagnostics, mediaRoutes].forEach((r) => {
      if (r && typeof r.setSupabaseClient === "function") {
        r.setSupabaseClient(supabase);
      }
    });
  }

  app.get("/", (req, res) => {
    res.json({ message: "Music App Backend Server" });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
  });

  // Serve frontend static files (must come after API routes)
  app.use(express.static(path.join(__dirname, "../frontend")));

  // SPA fallback - serve index.html for non-API routes (for client-side routing)
  app.use((req, res) => {
    // Don't serve SPA fallback for API routes or root path
    if (req.path.startsWith("/api") || req.path === "/") {
      return res.status(404).json({ error: "Not Found" });
    }
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  });

  // Error handling middleware
  // eslint-disable-next-line no-unused-vars
  const errorHandler = (err, req, res, next) => {
    console.error(err?.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err?.message });
  };
  app.use(errorHandler);
  // expose for tests
  app._errorHandler = errorHandler;

  // Start server helpers
  const startCallback = (server) => {
    const p = server.address()?.port;
    console.log(`Server running on port ${p}`);
  };

  const start = (port = PORT) => {
    const server = app.listen(port, () => startCallback(server));
    // keep reference so tests can close the server started via app.start()
    app._server = server;
    return server;
  };
  // expose for tests
  app._startCallback = startCallback;

  app.start = start;

  // allow dependency inspection
  app._injected = { prisma, supabase };

  return app;
}

module.exports = { createApp };

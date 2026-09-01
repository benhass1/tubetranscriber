import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { isTurnstileConfigured } from "../turnstile";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(compression());
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);

  // Non-secret liveness/readiness endpoint for Render, Caddy and operational checks.
  app.get("/healthz", (_req, res) => {
    const version = process.env.APP_VERSION || process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA || "development";
    const localFallbackSecretConfigured = Boolean((process.env.LOCAL_FALLBACK_SHARED_SECRET ?? "").trim());
    const localFallbackUrlConfigured = Boolean((process.env.LOCAL_FALLBACK_URL ?? "").trim());
    const isLocalFallbackServer = process.env.LOCAL_FALLBACK_SERVER === "true";
    const localFallbackConfigured = isLocalFallbackServer
      ? localFallbackSecretConfigured
      : localFallbackUrlConfigured && localFallbackSecretConfigured;
    res.status(200).json({
      ok: true,
      version,
      uptimeSeconds: Math.floor(process.uptime()),
      readiness: {
        application: true,
        localFallbackConfigured,
        localFallbackSecretConfigured,
        localFallbackServer: isLocalFallbackServer,
        turnstileConfigured: isTurnstileConfigured(),
      },
    });
  });

  // TubeTranscriber is public and does not require sign-in. Keep the template's
  // OAuth callback available only where the Manus OAuth service is configured,
  // so external hosts such as Render do not initialize an unused SDK client.
  if (process.env.OAUTH_SERVER_URL) {
    const { registerOAuthRoutes } = await import("./oauth");
    registerOAuthRoutes(app);
  }
  // Optional shared-secret guard for the Contabo fallback instance.
  const localFallbackSecret = (process.env.LOCAL_FALLBACK_SHARED_SECRET ?? "").trim();
  const isLocalFallbackServer = process.env.LOCAL_FALLBACK_SERVER === "true";
  if (isLocalFallbackServer && localFallbackSecret) {
    app.use("/api/trpc/transcript.lookup", (req, res, next) => {
      if (req.header("x-local-fallback-token") !== localFallbackSecret) {
        res.status(401).json({ error: "Unauthorized fallback request." });
        return;
      }
      next();
    });
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);

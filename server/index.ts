import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createApiProxy } from "./routes/proxy";
import {
  handleDemoLiveness,
  handleDemoReadiness,
  handleDemoOpenApi,
  handleDemoInfractions,
} from "./routes/demo-infractions";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  // Health check endpoints
  app.get("/liveness", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "Infractions API Manager",
    });
  });

  app.get("/readiness", (_req, res) => {
    // Check if the service is ready to serve requests
    // You can add more complex checks here (database, external services, etc.)
    const isReady = true; // Add your readiness logic here

    if (isReady) {
      res.json({
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
          external_api: "ok",
        },
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
          external_api: "error",
        },
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Demo API endpoints (for testing when real APIs are not available)
  // These must come BEFORE the proxy routes to avoid being intercepted

  // Infractions API demo endpoints
  app.get("/api/infractions/liveness", handleDemoLiveness);
  app.get("/api/infractions/readiness", handleDemoReadiness);
  app.get("/api/infractions/openapi.json", handleDemoOpenApi);
  app.post("/api/infractions", handleDemoInfractions);
  app.get("/api/infractions", handleDemoInfractions);

  // Demo API endpoints (self-referencing for demo purposes)
  app.get("/api/demo/liveness", handleDemoLiveness);
  app.get("/api/demo/readiness", handleDemoReadiness);
  app.get("/api/demo/openapi.json", handleDemoOpenApi);
  app.post("/api/demo", handleDemoInfractions);
  app.get("/api/demo", handleDemoInfractions);

  // Dynamic API proxy routes (catch-all, must be last)
  // Matches /api/{apiname}/* and forwards to configured API
  app.all("/api/:apiname/*", createApiProxy);
  app.all("/api/:apiname", createApiProxy);

  // Special endpoint for OpenAPI docs
  app.get("/api/:apiname/docs", (req, res) => {
    res.redirect(`/api/${req.params.apiname}/openapi.json`);
  });

  return app;
}

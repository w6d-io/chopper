import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

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
  app.get("/api/liveness", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "Infractions API Manager",
    });
  });

  app.get("/api/readiness", (_req, res) => {
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

  return app;
}

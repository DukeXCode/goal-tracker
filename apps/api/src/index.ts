import { Hono } from "hono";
import { cors } from "hono/cors";
import { goalRoutes } from "./routes/goals";
import { journalRoutes } from "./routes/journal";
import { coachingRoutes } from "./routes/coaching";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";

export type Bindings = {
  DB: D1Database;
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/auth", authRoutes);

app.use("/api/goals/*", authMiddleware);
app.use("/api/journal/*", authMiddleware);
app.use("/api/coaching/*", authMiddleware);

app.route("/api/goals", goalRoutes);
app.route("/api/journal", journalRoutes);
app.route("/api/coaching", coachingRoutes);

export default app;

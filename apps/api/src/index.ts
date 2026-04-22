import { Hono } from "hono";
import { cors } from "hono/cors";
import { goalRoutes } from "./routes/goals";
import { journalRoutes } from "./routes/journal";
import { coachingRoutes } from "./routes/coaching";

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.route("/api/goals", goalRoutes);
app.route("/api/journal", journalRoutes);
app.route("/api/coaching", coachingRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;

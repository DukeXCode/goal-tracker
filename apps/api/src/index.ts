import { Hono } from "hono";
import { cors } from "hono/cors";
import { goalRoutes } from "./routes/goals";
import { journalRoutes } from "./routes/journal";

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.route("/api/goals", goalRoutes);
app.route("/api/journal", journalRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;

import { Hono } from "hono";
import { cors } from "hono/cors";
import { StreamableHttpTransport } from "mcp-lite";
import { goalRoutes } from "./routes/goals";
import { journalRoutes } from "./routes/journal";
import { coachingRoutes } from "./routes/coaching";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import { createMcpServer } from "./mcp/server";

export type Bindings = {
  DB: D1Database;
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

// MCP server (Streamable HTTP), authenticated with the same JWT bearer token
// as the REST API. The server is built per request so its tool handlers close
// over this request's DB binding (the transport is stateless on Workers).
app.use("/mcp", authMiddleware);
app.all("/mcp", async (c) => {
  const transport = new StreamableHttpTransport();
  const handler = transport.bind(createMcpServer(c.env.DB));
  return handler(c.req.raw);
});

app.route("/api/auth", authRoutes);

app.use("/api/goals/*", authMiddleware);
app.use("/api/journal/*", authMiddleware);
app.use("/api/coaching/*", authMiddleware);

app.route("/api/goals", goalRoutes);
app.route("/api/journal", journalRoutes);
app.route("/api/coaching", coachingRoutes);

export default app;

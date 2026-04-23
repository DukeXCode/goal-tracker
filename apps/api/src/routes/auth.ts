import { Hono } from "hono";
import { sign } from "hono/jwt";
import type { Bindings } from "../index";
import { authMiddleware } from "../middleware/auth";

export const authRoutes = new Hono<{ Bindings: Bindings }>();

authRoutes.post("/login", async (c) => {
  const { AUTH_USERNAME, AUTH_PASSWORD, JWT_SECRET } = c.env;

  if (!AUTH_USERNAME || !AUTH_PASSWORD || !JWT_SECRET) {
    return c.json({ error: "Auth not configured" }, 500);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return c.json({ error: "Invalid credentials" }, 400);
  }

  if (body.username !== AUTH_USERNAME || body.password !== AUTH_PASSWORD) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: AUTH_USERNAME,
      iat: now,
      exp: now + 60 * 60 * 24 * 7,
    },
    JWT_SECRET,
    "HS256"
  );

  return c.json({ data: { token } });
});

authRoutes.get("/me", authMiddleware, (c) => {
  const payload = c.get("jwtPayload");
  return c.json({ data: { username: payload?.sub ?? null } });
});

import type { MiddlewareHandler } from "hono";
import { jwt } from "hono/jwt";
import type { Bindings } from "../index";

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "Auth not configured" }, 500);
  }
  return jwt({ secret, alg: "HS256" })(c, next);
};

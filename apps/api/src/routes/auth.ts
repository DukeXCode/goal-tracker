import { Hono } from "hono";
import type { Bindings } from "../index";
import type { AuthUser } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Bindings: Bindings;
  Variables: { user: AuthUser };
};

export const authRoutes = new Hono<AuthEnv>();

authRoutes.use("*", authMiddleware);

authRoutes.get("/me", (c) => {
  const user = c.get("user");
  return c.json({ data: { email: user.email } });
});

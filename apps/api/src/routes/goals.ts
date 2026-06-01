import { Hono } from "hono";
import type { Bindings } from "../index";
import type { CreateGoalInput, UpdateGoalInput, Goal } from "@goal-tracker/shared";
import { QueryError, listGoals, getGoal, createGoal } from "../db/queries";

export const goalRoutes = new Hono<{ Bindings: Bindings }>();

goalRoutes.get("/", async (c) => {
  const data = await listGoals(c.env.DB, c.req.query("status"));
  return c.json({ data });
});

goalRoutes.get("/:id", async (c) => {
  const result = await getGoal(c.env.DB, c.req.param("id"));

  if (!result) {
    return c.json({ error: "Goal not found" }, 404);
  }

  return c.json({ data: result });
});

goalRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateGoalInput>();

  try {
    const created = await createGoal(c.env.DB, body);
    return c.json({ data: created }, 201);
  } catch (e) {
    if (e instanceof QueryError) {
      return c.json({ error: e.message }, e.status);
    }
    throw e;
  }
});

goalRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateGoalInput>();

  const existing = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?")
    .bind(id)
    .first<Goal>();

  if (!existing) {
    return c.json({ error: "Goal not found" }, 404);
  }

  const title = body.title?.trim() ?? existing.title;
  const description = body.description?.trim() ?? existing.description;
  const status = body.status ?? existing.status;
  const target_date = body.target_date !== undefined ? body.target_date : existing.target_date;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE goals SET title = ?, description = ?, status = ?, target_date = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(title, description, status, target_date, now, id)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?")
    .bind(id)
    .first<Goal>();

  return c.json({ data: updated });
});

goalRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await c.env.DB.prepare("SELECT id FROM goals WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Goal not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM goals WHERE id = ?").bind(id).run();
  return c.body(null, 204);
});

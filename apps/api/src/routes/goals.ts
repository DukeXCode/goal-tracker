import { Hono } from "hono";
import type { Bindings } from "../index";
import type { CreateGoalInput, UpdateGoalInput, Goal } from "@goal-tracker/shared";

export const goalRoutes = new Hono<{ Bindings: Bindings }>();

goalRoutes.get("/", async (c) => {
  const status = c.req.query("status");
  let query = "SELECT * FROM goals";
  const params: string[] = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  const result = await c.env.DB.prepare(query).bind(...params).all<Goal>();
  return c.json({ data: result.results });
});

goalRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?")
    .bind(id)
    .first<Goal>();

  if (!result) {
    return c.json({ error: "Goal not found" }, 404);
  }

  return c.json({ data: result });
});

goalRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateGoalInput>();

  if (!body.title?.trim()) {
    return c.json({ error: "Title is required" }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO goals (id, title, description, status, target_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.title.trim(),
      body.description?.trim() ?? "",
      body.status ?? "not_started",
      body.target_date ?? null,
      now,
      now
    )
    .run();

  const created = await c.env.DB.prepare("SELECT * FROM goals WHERE id = ?")
    .bind(id)
    .first<Goal>();

  return c.json({ data: created }, 201);
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

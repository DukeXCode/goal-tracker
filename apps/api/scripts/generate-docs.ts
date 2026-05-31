import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import {
  endpoints,
  groups,
  schemas,
  apiTitle,
  apiVersion,
  apiDescription,
} from "./api-definitions";
import type { Endpoint, Field } from "./api-definitions";

const docsDir = join(import.meta.dir, "..", "docs");
mkdirSync(docsDir, { recursive: true });

// ─── Markdown Generation ─────────────────────────────────

function methodBadge(method: string): string {
  const colors: Record<string, string> = {
    GET: "green",
    POST: "blue",
    PUT: "orange",
    DELETE: "red",
  };
  return `\`[${method}]\`{style=color:${colors[method] ?? "gray"}}`;
}

function fieldTable(fields: Field[]): string {
  const header = "| Name | Type | Required | Description | Default |";
  const sep = "|------|------|----------|-------------|---------|";
  const rows = fields.map(
    (f) =>
      `| \`${f.name}\` | \`${f.type}\` | ${f.required ? "Yes" : "No"} | ${f.description} | ${f.default ?? "—"} |`
  );
  return [header, sep, ...rows].join("\n");
}

function generateMarkdown(): string {
  const lines: string[] = [];

  lines.push(`# ${apiTitle}`);
  lines.push("");
  lines.push(`> ${apiDescription}`);
  lines.push("");
  lines.push("## Authentication");
  lines.push("");
  lines.push(
    "Most endpoints require a JWT token. Obtain one via `POST /api/auth/login`, then include it in the `Authorization` header:"
  );
  lines.push("");
  lines.push("```");
  lines.push("Authorization: Bearer <token>");
  lines.push("```");
  lines.push("");
  lines.push("## Response Format");
  lines.push("");
  lines.push("All responses are wrapped in a standard envelope:");
  lines.push("");
  lines.push("- **Success:** `{ \"data\": <result> }`");
  lines.push("- **Error:** `{ \"error\": \"<message>\" }`");
  lines.push("");

  for (const group of groups) {
    const groupEndpoints = endpoints.filter((e) => e.group === group);
    if (groupEndpoints.length === 0) continue;

    lines.push(`## ${group}`);
    lines.push("");

    for (const ep of groupEndpoints) {
      const methodStr = `**\`${ep.method}\`**`;
      lines.push(`### ${methodStr} \`${ep.path}\``);
      lines.push("");
      lines.push(`**${ep.title}** — ${ep.description}`);
      lines.push("");

      if (ep.auth) {
        lines.push("- **Auth:** Required (JWT)");
      } else {
        lines.push("- **Auth:** Not required");
      }
      lines.push(`- **Status Code:** \`${ep.statusCode}\``);
      lines.push("");

      if (ep.queryParams && ep.queryParams.length > 0) {
        lines.push("#### Query Parameters");
        lines.push("");
        lines.push(fieldTable(ep.queryParams));
        lines.push("");
      }

      if (ep.requestBody && ep.requestBody.length > 0) {
        lines.push("#### Request Body");
        lines.push("");
        lines.push(fieldTable(ep.requestBody));
        lines.push("");
      }

      if (ep.example.request) {
        lines.push("#### Example Request");
        lines.push("");
        lines.push("```json");
        lines.push(ep.example.request);
        lines.push("```");
        lines.push("");
      }

      lines.push("#### Example Response");
      lines.push("");
      if (ep.responseType === "void") {
        lines.push("```");
        lines.push(ep.example.response);
        lines.push("```");
      } else {
        lines.push("```json");
        lines.push(ep.example.response);
        lines.push("```");
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Schemas section
  lines.push("## Data Schemas");
  lines.push("");

  for (const [name, schema] of Object.entries(schemas)) {
    lines.push(`### ${name}`);
    lines.push("");
    lines.push(schema.description);
    lines.push("");
    lines.push(fieldTable(schema.fields));
    lines.push("");
  }

  return lines.join("\n");
}

// ─── OpenAPI Generation ───────────────────────────────────

function typeToOpenAPI(type: string): Record<string, unknown> {
  if (type === "string") return { type: "string" };
  if (type === "string[]") return { type: "array", items: { type: "string" } };
  if (type.startsWith("string | null"))
    return { type: "string", nullable: true };
  if (type.startsWith('"') || type.includes(" | ")) {
    // enum-like: "not_started | in_progress | completed"
    const values = type
      .split(" | ")
      .map((v) => v.replace(/"/g, "").trim())
      .filter((v) => v !== "null");
    const nullable = type.includes("null");
    if (values.length === 1) {
      return { type: "string", enum: values, nullable };
    }
    return { type: "string", enum: values, nullable };
  }
  return { type: "string" };
}

function schemaToProperties(
  fields: Field[]
): Record<string, Record<string, unknown>> {
  const props: Record<string, Record<string, unknown>> = {};
  for (const f of fields) {
    if (f.type === "CoachingTopic[]") {
      props[f.name] = {
        type: "array",
        items: { $ref: "#/components/schemas/CoachingTopic" },
      };
    } else {
      props[f.name] = typeToOpenAPI(f.type);
      props[f.name].description = f.description;
    }
  }
  return props;
}

function endpointToOpenAPI(ep: Endpoint): Record<string, unknown> {
  const operation: Record<string, unknown> = {
    operationId: OperationId(ep),
    summary: ep.title,
    description: ep.description,
    tags: [ep.group],
    responses: {},
  };

  // Security
  if (ep.auth) {
    operation.security = [{ bearerAuth: [] }];
  }

  // Parameters (path + query)
  const parameters: Record<string, unknown>[] = [];
  const pathParams = ep.path.match(/:(\w+)/g);
  if (pathParams) {
    for (const p of pathParams) {
      const name = p.slice(1);
      parameters.push({
        name,
        in: "path",
        required: true,
        schema: { type: "string" },
        description: `The ${name}`,
      });
    }
  }
  if (ep.queryParams) {
    for (const q of ep.queryParams) {
      parameters.push({
        name: q.name,
        in: "query",
        required: q.required,
        schema: typeToOpenAPI(q.type),
        description: q.description,
      });
    }
  }
  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Request body
  if (ep.requestBody && ep.requestBody.length > 0) {
    const properties: Record<string, Record<string, unknown>> = {};
    const required: string[] = [];
    for (const f of ep.requestBody) {
      properties[f.name] = typeToOpenAPI(f.type);
      properties[f.name].description = f.description;
      if (f.required) required.push(f.name);
    }
    operation.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties,
            ...(required.length > 0 ? { required } : {}),
          },
        },
      },
    };
  }

  // Response
  const statusCode = String(ep.statusCode);
  if (ep.responseType === "void") {
    operation.responses[statusCode] = { description: "No content" };
  } else {
    let responseSchema: Record<string, unknown>;
    if (ep.responseType === "array") {
      // Find the matching schema from the example
      const schemaName = guessSchemaName(ep);
      responseSchema = {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: schemaName
              ? { $ref: `#/components/schemas/${schemaName}` }
              : { type: "object" },
          },
        },
      };
    } else {
      const schemaName = guessSchemaName(ep);
      responseSchema = {
        type: "object",
        properties: {
          data: schemaName
            ? { $ref: `#/components/schemas/${schemaName}` }
            : { type: "object" },
        },
      };
    }
    operation.responses[statusCode] = {
      description: "Success",
      content: { "application/json": { schema: responseSchema } },
    };
  }

  return operation;
}

function guessSchemaName(ep: Endpoint): string | null {
  if (ep.path.includes("/goals")) return "Goal";
  if (ep.path.includes("/journal")) return "JournalEntry";
  if (ep.path.includes("/topics")) return "CoachingTopic";
  if (ep.path.includes("/sessions")) return "CoachingSession";
  return null;
}

function OperationId(ep: Endpoint): string {
  const parts: string[] = [];
  parts.push(ep.method.toLowerCase());
  const segments = ep.path
    .replace(/\/api\//g, "")
    .split("/")
    .filter((s) => s);
  parts.push(
    ...segments.map((s) => {
      if (s.startsWith(":")) return "by_" + s.slice(1);
      return s.replace(/-/g, "_");
    })
  );
  return parts.join("_");
}

function generateOpenAPI(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const ep of endpoints) {
    if (!paths[ep.path]) paths[ep.path] = {};
    paths[ep.path][ep.method.toLowerCase()] = endpointToOpenAPI(ep);
  }

  const componentSchemas: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    componentSchemas[name] = {
      type: "object",
      description: schema.description,
      properties: schemaToProperties(schema.fields),
      required: schema.fields.filter((f) => f.required).map((f) => f.name),
    };
  }

  return {
    openapi: "3.0.3",
    info: {
      title: apiTitle,
      version: apiVersion,
      description: apiDescription,
    },
    servers: [
      {
        url: "/api",
        description: "API base path",
      },
    ],
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from POST /api/auth/login",
        },
      },
      schemas: componentSchemas,
    },
  };
}

// ─── Write Files ──────────────────────────────────────────

const markdown = generateMarkdown();
writeFileSync(join(docsDir, "API.md"), markdown);
console.log(`✅ Generated ${join(docsDir, "API.md")}`);

const openapi = generateOpenAPI();
writeFileSync(join(docsDir, "openapi.json"), JSON.stringify(openapi, null, 2));
console.log(`✅ Generated ${join(docsDir, "openapi.json")}`);

console.log(`\nDone! ${endpoints.length} endpoints documented across ${groups.length} groups.`);

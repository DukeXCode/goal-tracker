import { createMiddleware } from "hono/factory";
import type { Bindings } from "../index";

export type AuthUser = {
  email: string;
};

type AuthEnv = {
  Bindings: Bindings;
  Variables: { user: AuthUser };
};

const CERTS_CACHE_TTL = 60 * 60 * 1000;
let cachedCerts: { keys: JsonWebKey[]; timestamp: number } | null = null;

async function getAccessPublicKeys(teamName: string): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (cachedCerts && now - cachedCerts.timestamp < CERTS_CACHE_TTL) {
    return cachedCerts.keys;
  }

  const res = await fetch(
    `https://${teamName}.cloudflareaccess.com/cdn-cgi/access/certs`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Access public keys: ${res.status}`);
  }

  const data = (await res.json()) as {
    keys?: JsonWebKey[];
  };

  if (!data.keys?.length) {
    throw new Error("No public keys found in Access certs response");
  }

  cachedCerts = { keys: data.keys, timestamp: now };
  return data.keys;
}

async function verifyAccessJwt(
  token: string,
  teamName: string,
  audienceTag: string
): Promise<{ email: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const header = JSON.parse(atob(parts[0])) as { kid?: string; alg?: string };
  const payload = JSON.parse(atob(parts[1])) as {
    email?: string;
    aud?: string | string[];
    iss?: string;
    exp?: number;
  };

  if (!payload.email) {
    throw new Error("Missing email in JWT payload");
  }

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audienceTag)) {
    throw new Error("JWT audience does not match configured audience tag");
  }

  if (payload.iss !== `https://${teamName}.cloudflareaccess.com`) {
    throw new Error("JWT issuer does not match configured team");
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error("JWT has expired");
  }

  const publicKeys = await getAccessPublicKeys(teamName);
  const key = publicKeys.find((k) => (k as { kid?: string }).kid === header.kid);
  if (!key) {
    throw new Error("No matching key found for JWT kid");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signatureBytes = new Uint8Array(
    [...atob(parts[2])].map((c) => c.charCodeAt(0))
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signatureBytes,
    signatureInput
  );

  if (!valid) {
    throw new Error("JWT signature verification failed");
  }

  return { email: payload.email };
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const teamName = c.env.CF_ACCESS_TEAM_NAME;
  const audienceTag = c.env.CF_ACCESS_AUD_TAG;

  if (!teamName || !audienceTag) {
    c.set("user", { email: "dev@localhost" });
    return next();
  }

  const assertion = c.req.header("Cf-Access-Jwt-Assertion");
  if (!assertion) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const { email } = await verifyAccessJwt(assertion, teamName, audienceTag);
    c.set("user", { email });
  } catch {
    return c.json({ error: "Invalid or expired authentication token" }, 401);
  }

  return next();
});

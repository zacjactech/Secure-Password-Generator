// Quick E2E check script for local dev server at http://localhost:3001
// Steps: signup -> 2FA setup+verify -> add/edit/delete vault item -> export

import { authenticator } from "otplib";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

function log(step, details) {
  console.log(`\n[${step}]`);
  if (details) console.log(details);
}

function parseSetCookie(setCookieHeaders) {
  if (!setCookieHeaders) return "";
  // Node fetch returns a single combined header or array; normalize
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  // Keep only the cookie pairs (name=value)
  const cookies = headers.map((h) => h.split(";")[0]).join("; ");
  return cookies;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...options,
  });
  const contentType = res.headers.get("content-type") || "";
  let body;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, ok: res.ok, body, setCookie };
}

async function run() {
  const email = `e2e+${Date.now()}@example.com`;
  const password = "Password123!";
  let cookie = "";

  // 1) Signup
  log("Signup", `${email}`);
  let r = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Signup failed: ${r.status} ${JSON.stringify(r.body)}`);
  cookie = parseSetCookie(r.setCookie) || cookie;
  log("Signup ok", `cookie set: ${cookie.includes("session=")}`);

  // 2) 2FA setup
  log("2FA setup");
  r = await request("/api/2fa/setup", { method: "POST", headers: { cookie } });
  if (!r.ok) throw new Error(`2FA setup failed: ${r.status} ${JSON.stringify(r.body)}`);
  const secret = r.body?.secret;
  if (!secret) throw new Error("No 2FA secret returned");
  log("2FA secret", secret);

  // 3) 2FA verify
  const token = authenticator.generate(secret);
  log("2FA token", token);
  r = await request("/api/2fa/verify", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ token }),
  });
  if (!r.ok) throw new Error(`2FA verify failed: ${r.status} ${JSON.stringify(r.body)}`);
  log("2FA verified");

  // 4) Add vault item
  const newItem = {
    title: "Example",
    username: "user",
    url: "https://example.com",
    ciphertext: "ZmFrZWNpcGhlcmRhdGE=", // fake base64
    iv: "ZmFrZWl2",
  };
  r = await request("/api/vault", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(newItem),
  });
  if (!r.ok) throw new Error(`Add vault item failed: ${r.status} ${JSON.stringify(r.body)}`);
  const created = r.body;
  log("Vault item created", JSON.stringify(created));

  // 5) List vault items
  r = await request("/api/vault", { headers: { cookie } });
  if (!r.ok) throw new Error(`List vault failed: ${r.status} ${JSON.stringify(r.body)}`);
  const list = Array.isArray(r.body?.items) ? r.body.items : r.body;
  const itemId = created?.id || list?.[0]?.id;
  if (!itemId) throw new Error("No vault item id returned");
  log("Vault list count", list?.length);

  // 6) Edit vault item
  r = await request(`/api/vault/${itemId}`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ title: "Example Updated" }),
  });
  if (!r.ok) throw new Error(`Edit vault item failed: ${r.status} ${JSON.stringify(r.body)}`);
  log("Vault item updated");

  // 7) Delete vault item
  r = await request(`/api/vault/${itemId}`, { method: "DELETE", headers: { cookie } });
  if (!r.ok) throw new Error(`Delete vault item failed: ${r.status} ${JSON.stringify(r.body)}`);
  log("Vault item deleted");

  // 8) Export (should be empty or without deleted item)
  r = await request("/api/export", { method: "POST", headers: { cookie } });
  if (!r.ok) throw new Error(`Export failed: ${r.status} ${JSON.stringify(r.body)}`);
  const exported = r.body?.items || r.body;
  log("Export count", Array.isArray(exported) ? exported.length : exported);

  console.log("\nE2E steps completed successfully.");
}

run().catch((err) => {
  console.error("E2E failed:", err.message);
  process.exitCode = 1;
});
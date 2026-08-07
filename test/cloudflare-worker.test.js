import test from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/src/index.js";

const env = {
  ALLOWED_ORIGIN: "https://tegy-ai.vercel.app",
  TEGY_API_TOKEN: "test-token",
};

test("Worker health endpoint does not require authentication", async () => {
  const response = await worker.fetch(new Request("https://api.example.com/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "tegy-api", database: "d1" });
});

test("Worker protects database routes", async () => {
  const response = await worker.fetch(new Request("https://api.example.com/v1/projects?organization_id=tegy"), env);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("Worker handles CORS preflight for the production frontend", async () => {
  const request = new Request("https://api.example.com/v1/projects", {
    method: "OPTIONS",
    headers: { origin: "https://tegy-ai.vercel.app" },
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://tegy-ai.vercel.app");
});


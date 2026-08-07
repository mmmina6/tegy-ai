const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin");
  const allowed = env.ALLOWED_ORIGIN || "https://tegy-ai.vercel.app";
  return {
    "access-control-allow-origin": origin === allowed ? origin : allowed,
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    vary: "Origin",
  };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
}

function requireServiceAuth(request, env) {
  if (!env.TEGY_API_TOKEN) return json({ error: "Server is missing TEGY_API_TOKEN" }, 503);
  const expected = `Bearer ${env.TEGY_API_TOKEN}`;
  if (request.headers.get("authorization") !== expected) return json({ error: "Unauthorized" }, 401);
  return null;
}

async function bodyJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function required(body, fields) {
  return fields.filter((field) => !body?.[field] || typeof body[field] !== "string");
}

function parseJsonFields(row) {
  if (!row) return row;
  const result = { ...row };
  for (const key of Object.keys(result)) {
    if (!key.endsWith("_json")) continue;
    const target = key.slice(0, -5);
    try { result[target] = JSON.parse(result[key]); } catch { result[target] = result[key]; }
    delete result[key];
  }
  return result;
}

async function listProjects(env, url) {
  const organizationId = url.searchParams.get("organization_id");
  if (!organizationId) return json({ error: "organization_id is required" }, 400);
  const query = url.searchParams.get("q")?.trim();
  const statement = query
    ? env.DB.prepare(`SELECT * FROM projects WHERE organization_id = ? AND (project_name LIKE ? OR client_name LIKE ?) ORDER BY updated_at DESC LIMIT 100`).bind(organizationId, `%${query}%`, `%${query}%`)
    : env.DB.prepare(`SELECT * FROM projects WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(organizationId);
  const { results = [] } = await statement.all();
  return json({ projects: results.map(parseJsonFields) });
}

async function createProject(request, env) {
  const body = await bodyJson(request);
  const missing = required(body, ["organization_id", "client_name", "project_name"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO projects (id, organization_id, client_name, project_name, status, owner_user_id, deadline, final_requirement, current_task, customer_context_json, product_context_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.organization_id, body.client_name, body.project_name, body.status || "active", body.owner_user_id || null, body.deadline || null, body.final_requirement || null, body.current_task || null, JSON.stringify(body.customer_context || {}), JSON.stringify(body.product_context || {})).run();
  const project = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first();
  return json({ project: parseJsonFields(project) }, 201);
}

async function getProject(env, projectId) {
  const project = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(projectId).first();
  if (!project) return json({ error: "Project not found" }, 404);
  const { results: works = [] } = await env.DB.prepare(`SELECT * FROM works WHERE project_id = ? AND status != 'archived' ORDER BY updated_at DESC`).bind(projectId).all();
  return json({ project: parseJsonFields(project), works: works.map(parseJsonFields) });
}

async function updateProject(request, env, projectId) {
  const body = await bodyJson(request);
  if (!body) return json({ error: "Invalid JSON body" }, 400);
  const current = await env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(projectId).first();
  if (!current) return json({ error: "Project not found" }, 404);
  await env.DB.prepare(`UPDATE projects SET client_name=?, project_name=?, status=?, owner_user_id=?, deadline=?, final_requirement=?, current_task=?, customer_context_json=?, product_context_json=?, updated_at=datetime('now') WHERE id=?`)
    .bind(body.client_name ?? current.client_name, body.project_name ?? current.project_name, body.status ?? current.status, body.owner_user_id ?? current.owner_user_id, body.deadline ?? current.deadline, body.final_requirement ?? current.final_requirement, body.current_task ?? current.current_task, JSON.stringify(body.customer_context ?? JSON.parse(current.customer_context_json || "{}")), JSON.stringify(body.product_context ?? JSON.parse(current.product_context_json || "{}")), projectId).run();
  return getProject(env, projectId);
}

async function createWork(request, env, projectId) {
  const body = await bodyJson(request);
  const missing = required(body, ["type", "title"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO works (id, project_id, campaign_id, type, title, status, progress, owner_user_id, workspace_state_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, projectId, body.campaign_id || null, body.type, body.title, body.status || "ready", body.progress || 0, body.owner_user_id || null, JSON.stringify(body.workspace_state || {})).run();
  const work = await env.DB.prepare(`SELECT * FROM works WHERE id = ?`).bind(id).first();
  return json({ work: parseJsonFields(work) }, 201);
}

async function updateWork(request, env, workId) {
  const body = await bodyJson(request);
  if (!body) return json({ error: "Invalid JSON body" }, 400);
  const current = await env.DB.prepare(`SELECT * FROM works WHERE id = ?`).bind(workId).first();
  if (!current) return json({ error: "Work not found" }, 404);
  await env.DB.prepare(`UPDATE works SET title=?, status=?, progress=?, owner_user_id=?, workspace_state_json=?, updated_at=datetime('now') WHERE id=?`)
    .bind(body.title ?? current.title, body.status ?? current.status, body.progress ?? current.progress, body.owner_user_id ?? current.owner_user_id, JSON.stringify(body.workspace_state ?? JSON.parse(current.workspace_state_json || "{}")), workId).run();
  const work = await env.DB.prepare(`SELECT * FROM works WHERE id = ?`).bind(workId).first();
  return json({ work: parseJsonFields(work) });
}

async function archiveWork(env, workId) {
  const result = await env.DB.prepare(`UPDATE works SET status='archived', updated_at=datetime('now') WHERE id=?`).bind(workId).run();
  if (!result.meta?.changes) return json({ error: "Work not found" }, 404);
  return json({ archived: true, id: workId });
}

async function listDeliverables(env, workId) {
  const { results = [] } = await env.DB.prepare(`SELECT * FROM deliverables WHERE work_id = ? AND status != 'archived' ORDER BY updated_at DESC`).bind(workId).all();
  return json({ deliverables: results });
}

async function createDeliverable(request, env, workId) {
  const body = await bodyJson(request);
  const missing = required(body, ["kind", "title"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const deliverableId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`INSERT INTO deliverables (id, work_id, kind, title, status, current_version, created_by_user_id) VALUES (?, ?, ?, ?, ?, 1, ?)`).bind(deliverableId, workId, body.kind, body.title, body.status || "draft", body.created_by_user_id || null),
    env.DB.prepare(`INSERT INTO deliverable_versions (id, deliverable_id, version_number, content_json, change_summary, created_by_user_id) VALUES (?, ?, 1, ?, ?, ?)`).bind(versionId, deliverableId, JSON.stringify(body.content || {}), body.change_summary || "Initial version", body.created_by_user_id || null),
  ];
  await env.DB.batch(statements);
  const deliverable = await env.DB.prepare(`SELECT * FROM deliverables WHERE id = ?`).bind(deliverableId).first();
  return json({ deliverable }, 201);
}

async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "tegy-api", database: "d1" });
  const authError = requireServiceAuth(request, env);
  if (authError) return authError;

  if (url.pathname === "/v1/projects" && request.method === "GET") return listProjects(env, url);
  if (url.pathname === "/v1/projects" && request.method === "POST") return createProject(request, env);

  const projectMatch = url.pathname.match(/^\/v1\/projects\/([^/]+)$/);
  if (projectMatch && request.method === "GET") return getProject(env, projectMatch[1]);
  if (projectMatch && request.method === "PATCH") return updateProject(request, env, projectMatch[1]);

  const projectWorksMatch = url.pathname.match(/^\/v1\/projects\/([^/]+)\/works$/);
  if (projectWorksMatch && request.method === "POST") return createWork(request, env, projectWorksMatch[1]);

  const workMatch = url.pathname.match(/^\/v1\/works\/([^/]+)$/);
  if (workMatch && request.method === "PATCH") return updateWork(request, env, workMatch[1]);
  if (workMatch && request.method === "DELETE") return archiveWork(env, workMatch[1]);

  const deliverablesMatch = url.pathname.match(/^\/v1\/works\/([^/]+)\/deliverables$/);
  if (deliverablesMatch && request.method === "GET") return listDeliverables(env, deliverablesMatch[1]);
  if (deliverablesMatch && request.method === "POST") return createDeliverable(request, env, deliverablesMatch[1]);

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    try {
      return withCors(await route(request, env), request, env);
    } catch (error) {
      console.error(error);
      return withCors(json({ error: "Internal server error" }, 500), request, env);
    }
  },
};


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

async function campaigns(request, env, projectId) {
  if (request.method === "GET") {
    const { results = [] } = await env.DB.prepare(`SELECT * FROM campaigns WHERE project_id=? AND status!='archived' ORDER BY updated_at DESC`).bind(projectId).all();
    return json({ campaigns: results.map(parseJsonFields) });
  }
  const body = await bodyJson(request);
  const missing = required(body, ["name"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO campaigns (id, project_id, name, objective, platforms_json, brief_json, status) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, projectId, body.name, body.objective || null, JSON.stringify(body.platforms || []), JSON.stringify(body.brief || {}), body.status || "draft").run();
  return json({ campaign: parseJsonFields(await env.DB.prepare(`SELECT * FROM campaigns WHERE id=?`).bind(id).first()) }, 201);
}

async function updateCampaign(request, env, campaignId) {
  const body = await bodyJson(request);
  const current = await env.DB.prepare(`SELECT * FROM campaigns WHERE id=?`).bind(campaignId).first();
  if (!current) return json({ error: "Campaign not found" }, 404);
  await env.DB.prepare(`UPDATE campaigns SET name=?, objective=?, platforms_json=?, brief_json=?, status=?, updated_at=datetime('now') WHERE id=?`)
    .bind(body?.name ?? current.name, body?.objective ?? current.objective, JSON.stringify(body?.platforms ?? JSON.parse(current.platforms_json || "[]")), JSON.stringify(body?.brief ?? JSON.parse(current.brief_json || "{}")), body?.status ?? current.status, campaignId).run();
  return json({ campaign: parseJsonFields(await env.DB.prepare(`SELECT * FROM campaigns WHERE id=?`).bind(campaignId).first()) });
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

async function getDeliverable(env, deliverableId) {
  const deliverable = await env.DB.prepare(`SELECT * FROM deliverables WHERE id=?`).bind(deliverableId).first();
  if (!deliverable) return json({ error: "Deliverable not found" }, 404);
  const { results: versions = [] } = await env.DB.prepare(`SELECT * FROM deliverable_versions WHERE deliverable_id=? ORDER BY version_number DESC`).bind(deliverableId).all();
  const { results: approvals = [] } = await env.DB.prepare(`SELECT * FROM approvals WHERE deliverable_id=? ORDER BY created_at DESC`).bind(deliverableId).all();
  const { results: files = [] } = await env.DB.prepare(`SELECT * FROM drive_files WHERE deliverable_id=? ORDER BY updated_at DESC`).bind(deliverableId).all();
  return json({ deliverable, versions: versions.map(parseJsonFields), approvals, drive_files: files });
}

async function createVersion(request, env, deliverableId) {
  const body = await bodyJson(request);
  if (!body || typeof body.content !== "object") return json({ error: "content is required" }, 400);
  const deliverable = await env.DB.prepare(`SELECT * FROM deliverables WHERE id=?`).bind(deliverableId).first();
  if (!deliverable) return json({ error: "Deliverable not found" }, 404);
  const versionNumber = Number(deliverable.current_version) + 1;
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO deliverable_versions (id, deliverable_id, version_number, content_json, change_summary, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, deliverableId, versionNumber, JSON.stringify(body.content), body.change_summary || null, body.created_by_user_id || null),
    env.DB.prepare(`UPDATE deliverables SET current_version=?, status='draft', updated_at=datetime('now') WHERE id=?`).bind(versionNumber, deliverableId)
  ]);
  return json({ version: parseJsonFields(await env.DB.prepare(`SELECT * FROM deliverable_versions WHERE id=?`).bind(id).first()) }, 201);
}

async function createApproval(request, env, deliverableId) {
  const body = await bodyJson(request) || {};
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO approvals (id, deliverable_id, requested_by_user_id, reviewer_user_id, status, comment) VALUES (?, ?, ?, ?, 'pending', ?)`)
    .bind(id, deliverableId, body.requested_by_user_id || null, body.reviewer_user_id || null, body.comment || null).run();
  await env.DB.prepare(`UPDATE deliverables SET status='review', updated_at=datetime('now') WHERE id=?`).bind(deliverableId).run();
  return json({ approval: await env.DB.prepare(`SELECT * FROM approvals WHERE id=?`).bind(id).first() }, 201);
}

async function updateApproval(request, env, approvalId) {
  const body = await bodyJson(request);
  if (!body || !["approved", "changes_requested", "cancelled"].includes(body.status)) return json({ error: "Invalid approval status" }, 400);
  const approval = await env.DB.prepare(`SELECT * FROM approvals WHERE id=?`).bind(approvalId).first();
  if (!approval) return json({ error: "Approval not found" }, 404);
  await env.DB.prepare(`UPDATE approvals SET status=?, comment=?, decided_at=datetime('now') WHERE id=?`).bind(body.status, body.comment ?? approval.comment, approvalId).run();
  if (body.status === "approved") await env.DB.prepare(`UPDATE deliverables SET status='approved', updated_at=datetime('now') WHERE id=?`).bind(approval.deliverable_id).run();
  return json({ approval: await env.DB.prepare(`SELECT * FROM approvals WHERE id=?`).bind(approvalId).first() });
}

async function driveFiles(request, env, workId) {
  if (request.method === "GET") {
    const { results = [] } = await env.DB.prepare(`SELECT * FROM drive_files WHERE work_id=? ORDER BY updated_at DESC`).bind(workId).all();
    return json({ drive_files: results });
  }
  const body = await bodyJson(request);
  const missing = required(body, ["organization_id", "google_drive_file_id", "file_name"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO drive_files (id, organization_id, project_id, work_id, deliverable_id, google_drive_file_id, shared_drive_id, mime_type, file_name, web_view_link, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.organization_id, body.project_id || null, workId, body.deliverable_id || null, body.google_drive_file_id, body.shared_drive_id || null, body.mime_type || null, body.file_name, body.web_view_link || null, body.created_by_user_id || null).run();
  return json({ drive_file: await env.DB.prepare(`SELECT * FROM drive_files WHERE id=?`).bind(id).first() }, 201);
}

async function globalSearch(env, url) {
  const organizationId = url.searchParams.get("organization_id") || "tegy";
  const query = (url.searchParams.get("q") || "").trim();
  if (!query) return json({ results: [] });
  const pattern = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const { results = [] } = await env.DB.prepare(`
    SELECT * FROM (
      SELECT p.id, p.id AS project_id, NULL AS work_id, 'project' AS result_type,
        p.project_name AS title, p.client_name AS subtitle, p.updated_at
      FROM projects p
      WHERE p.organization_id = ? AND p.status != 'archived'
        AND (p.project_name LIKE ? ESCAPE '\\' OR p.client_name LIKE ? ESCAPE '\\' OR p.final_requirement LIKE ? ESCAPE '\\')
      UNION ALL
      SELECT w.id, p.id AS project_id, w.id AS work_id, 'work' AS result_type,
        w.title AS title, p.project_name || ' · ' || w.type AS subtitle, w.updated_at
      FROM works w JOIN projects p ON p.id = w.project_id
      WHERE p.organization_id = ? AND w.status != 'archived'
        AND (w.title LIKE ? ESCAPE '\\' OR w.type LIKE ? ESCAPE '\\' OR w.workspace_state_json LIKE ? ESCAPE '\\')
      UNION ALL
      SELECT d.id, p.id AS project_id, w.id AS work_id, 'deliverable' AS result_type,
        d.title AS title, p.project_name || ' · ' || d.kind || ' · v' || d.current_version AS subtitle, d.updated_at
      FROM deliverables d JOIN works w ON w.id = d.work_id JOIN projects p ON p.id = w.project_id
      WHERE p.organization_id = ? AND d.status != 'archived'
        AND (d.title LIKE ? ESCAPE '\\' OR d.kind LIKE ? ESCAPE '\\' OR EXISTS (
          SELECT 1 FROM deliverable_versions dv WHERE dv.deliverable_id = d.id AND dv.content_json LIKE ? ESCAPE '\\'
        ))
    ) ORDER BY updated_at DESC LIMIT 30
  `).bind(organizationId, pattern, pattern, pattern, organizationId, pattern, pattern, pattern, organizationId, pattern, pattern, pattern).all();
  return json({ results });
}

async function generationJobs(request, env, url) {
  if (request.method === "GET") {
    const organizationId = url.searchParams.get("organization_id") || "tegy";
    const projectId = url.searchParams.get("project_id");
    const status = url.searchParams.get("status");
    let sql = `SELECT * FROM generation_jobs WHERE organization_id=?`;
    const bindings = [organizationId];
    if (projectId) { sql += ` AND project_id=?`; bindings.push(projectId); }
    if (status) { sql += ` AND status=?`; bindings.push(status); }
    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const { results = [] } = await env.DB.prepare(sql).bind(...bindings).all();
    return json({ jobs: results.map(parseJsonFields) });
  }
  const body = await bodyJson(request);
  const missing = required(body, ["organization_id", "media_type", "provider"]);
  if (missing.length) return json({ error: `Missing: ${missing.join(", ")}` }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO generation_jobs (id, organization_id, project_id, work_id, deliverable_id, media_type, provider, model, status, input_json, usage_units, estimated_cost_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, body.organization_id, body.project_id || null, body.work_id || null, body.deliverable_id || null, body.media_type, body.provider, body.model || null, body.status || "queued", JSON.stringify(body.input || {}), Number(body.usage_units || 0), body.estimated_cost_usd ?? null).run();
  return json({ job: parseJsonFields(await env.DB.prepare(`SELECT * FROM generation_jobs WHERE id=?`).bind(id).first()) }, 201);
}

async function updateGenerationJob(request, env, jobId) {
  const body = await bodyJson(request) || {};
  const current = await env.DB.prepare(`SELECT * FROM generation_jobs WHERE id=?`).bind(jobId).first();
  if (!current) return json({ error: "Generation job not found" }, 404);
  const status = body.status || current.status;
  await env.DB.prepare(`UPDATE generation_jobs SET status=?, model=?, output_json=?, usage_units=?, estimated_cost_usd=?, actual_cost_usd=?, error_message=?, started_at=CASE WHEN ?='processing' AND started_at IS NULL THEN datetime('now') ELSE started_at END, completed_at=CASE WHEN ? IN ('completed','failed','cancelled') THEN datetime('now') ELSE completed_at END, updated_at=datetime('now') WHERE id=?`)
    .bind(status, body.model ?? current.model, JSON.stringify(body.output ?? JSON.parse(current.output_json || "{}")), body.usage_units ?? current.usage_units, body.estimated_cost_usd ?? current.estimated_cost_usd, body.actual_cost_usd ?? current.actual_cost_usd, body.error_message ?? current.error_message, status, status, jobId).run();
  return json({ job: parseJsonFields(await env.DB.prepare(`SELECT * FROM generation_jobs WHERE id=?`).bind(jobId).first()) });
}

async function usageSummary(env, url) {
  const organizationId = url.searchParams.get("organization_id") || "tegy";
  const projectId = url.searchParams.get("project_id");
  const clause = projectId ? ` AND project_id=?` : "";
  const bindings = projectId ? [organizationId, projectId] : [organizationId];
  const { results = [] } = await env.DB.prepare(`SELECT media_type, provider, model, COUNT(*) AS job_count, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed_count, SUM(usage_units) AS usage_units, SUM(COALESCE(actual_cost_usd, estimated_cost_usd, 0)) AS tracked_cost_usd FROM generation_jobs WHERE organization_id=?${clause} GROUP BY media_type, provider, model ORDER BY media_type, provider`).bind(...bindings).all();
  return json({ summary: results });
}

async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "tegy-api", database: "d1" });
  const authError = requireServiceAuth(request, env);
  if (authError) return authError;

  if (url.pathname === "/v1/projects" && request.method === "GET") return listProjects(env, url);
  if (url.pathname === "/v1/projects" && request.method === "POST") return createProject(request, env);
  if (url.pathname === "/v1/search" && request.method === "GET") return globalSearch(env, url);
  if (url.pathname === "/v1/generation-jobs" && ["GET", "POST"].includes(request.method)) return generationJobs(request, env, url);
  if (url.pathname === "/v1/usage-summary" && request.method === "GET") return usageSummary(env, url);
  const generationJobMatch = url.pathname.match(/^\/v1\/generation-jobs\/([^/]+)$/);
  if (generationJobMatch && request.method === "PATCH") return updateGenerationJob(request, env, generationJobMatch[1]);

  const projectMatch = url.pathname.match(/^\/v1\/projects\/([^/]+)$/);
  if (projectMatch && request.method === "GET") return getProject(env, projectMatch[1]);
  if (projectMatch && request.method === "PATCH") return updateProject(request, env, projectMatch[1]);

  const projectWorksMatch = url.pathname.match(/^\/v1\/projects\/([^/]+)\/works$/);
  if (projectWorksMatch && request.method === "POST") return createWork(request, env, projectWorksMatch[1]);

  const campaignsMatch = url.pathname.match(/^\/v1\/projects\/([^/]+)\/campaigns$/);
  if (campaignsMatch && ["GET", "POST"].includes(request.method)) return campaigns(request, env, campaignsMatch[1]);
  const campaignMatch = url.pathname.match(/^\/v1\/campaigns\/([^/]+)$/);
  if (campaignMatch && request.method === "PATCH") return updateCampaign(request, env, campaignMatch[1]);

  const workMatch = url.pathname.match(/^\/v1\/works\/([^/]+)$/);
  if (workMatch && request.method === "PATCH") return updateWork(request, env, workMatch[1]);
  if (workMatch && request.method === "DELETE") return archiveWork(env, workMatch[1]);

  const deliverablesMatch = url.pathname.match(/^\/v1\/works\/([^/]+)\/deliverables$/);
  if (deliverablesMatch && request.method === "GET") return listDeliverables(env, deliverablesMatch[1]);
  if (deliverablesMatch && request.method === "POST") return createDeliverable(request, env, deliverablesMatch[1]);

  const driveFilesMatch = url.pathname.match(/^\/v1\/works\/([^/]+)\/drive-files$/);
  if (driveFilesMatch && ["GET", "POST"].includes(request.method)) return driveFiles(request, env, driveFilesMatch[1]);
  const deliverableMatch = url.pathname.match(/^\/v1\/deliverables\/([^/]+)$/);
  if (deliverableMatch && request.method === "GET") return getDeliverable(env, deliverableMatch[1]);
  const versionsMatch = url.pathname.match(/^\/v1\/deliverables\/([^/]+)\/versions$/);
  if (versionsMatch && request.method === "POST") return createVersion(request, env, versionsMatch[1]);
  const approvalsMatch = url.pathname.match(/^\/v1\/deliverables\/([^/]+)\/approvals$/);
  if (approvalsMatch && request.method === "POST") return createApproval(request, env, approvalsMatch[1]);
  const approvalMatch = url.pathname.match(/^\/v1\/approvals\/([^/]+)$/);
  if (approvalMatch && request.method === "PATCH") return updateApproval(request, env, approvalMatch[1]);

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

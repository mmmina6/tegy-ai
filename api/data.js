const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const ALLOWED_PATHS = [
  /^\/v1\/projects$/,
  /^\/v1\/search$/,
  /^\/v1\/generation-jobs$/,
  /^\/v1\/generation-jobs\/[a-zA-Z0-9_-]+$/,
  /^\/v1\/usage-summary$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+\/works$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+\/campaigns$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+\/operations$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+\/content-items$/,
  /^\/v1\/projects\/[a-zA-Z0-9_-]+\/performance$/,
  /^\/v1\/campaigns\/[a-zA-Z0-9_-]+$/,
  /^\/v1\/works\/[a-zA-Z0-9_-]+$/,
  /^\/v1\/works\/[a-zA-Z0-9_-]+\/deliverables$/,
  /^\/v1\/works\/[a-zA-Z0-9_-]+\/drive-files$/,
  /^\/v1\/deliverables\/[a-zA-Z0-9_-]+$/,
  /^\/v1\/deliverables\/[a-zA-Z0-9_-]+\/versions$/,
  /^\/v1\/deliverables\/[a-zA-Z0-9_-]+\/approvals$/,
  /^\/v1\/approvals\/[a-zA-Z0-9_-]+$/
];

function isAllowedPath(path) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

export default async function handler(request, response) {
  if (!ALLOWED_METHODS.has(request.method)) return response.status(405).json({ error: 'Method not allowed.' });

  const path = typeof request.query?.path === 'string' ? request.query.path : '';
  if (!isAllowedPath(path)) return response.status(400).json({ error: 'Invalid data path.' });

  const workerUrl = process.env.TEGY_API_URL;
  const serviceToken = process.env.TEGY_API_TOKEN;
  if (!workerUrl || !serviceToken) return response.status(503).json({ error: 'Project database is not configured yet.' });

  const target = new URL(path, workerUrl.endsWith('/') ? workerUrl : `${workerUrl}/`);
  for (const [key, value] of Object.entries(request.query || {})) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach((item) => target.searchParams.append(key, item));
    else if (value !== undefined) target.searchParams.set(key, value);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        authorization: `Bearer ${serviceToken}`,
        'content-type': 'application/json'
      },
      body: request.method === 'GET' ? undefined : JSON.stringify(request.body || {}),
      signal: AbortSignal.timeout(10000)
    });
    const payload = await upstream.json().catch(() => ({ error: 'Invalid database response.' }));
    return response.status(upstream.status).json(payload);
  } catch (error) {
    console.error('TEGY data proxy failed:', error);
    return response.status(502).json({ error: 'Project database is temporarily unavailable.' });
  }
}

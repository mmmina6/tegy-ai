import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/data.js';

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

test('data proxy keeps the service token server-side', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.TEGY_API_URL;
  const originalToken = process.env.TEGY_API_TOKEN;
  process.env.TEGY_API_URL = 'https://tegy-api.example.com';
  process.env.TEGY_API_TOKEN = 'internal-test-token';
  globalThis.fetch = async (url, options) => {
    assert.equal(url.toString(), 'https://tegy-api.example.com/v1/projects?organization_id=tegy');
    assert.equal(options.headers.authorization, 'Bearer internal-test-token');
    return { status: 200, json: async () => ({ projects: [] }) };
  };
  try {
    const response = responseRecorder();
    await handler({ method: 'GET', query: { path: '/v1/projects', organization_id: 'tegy' } }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload, { projects: [] });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.TEGY_API_URL; else process.env.TEGY_API_URL = originalUrl;
    if (originalToken === undefined) delete process.env.TEGY_API_TOKEN; else process.env.TEGY_API_TOKEN = originalToken;
  }
});

test('data proxy rejects arbitrary upstream paths', async () => {
  const response = responseRecorder();
  await handler({ method: 'GET', query: { path: '/admin/secrets' } }, response);
  assert.equal(response.statusCode, 400);
});

test('data proxy forwards deliverable versions without exposing the service token', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.TEGY_API_URL;
  const originalToken = process.env.TEGY_API_TOKEN;
  process.env.TEGY_API_URL = 'https://tegy-api.example.com';
  process.env.TEGY_API_TOKEN = 'internal-version-token';
  globalThis.fetch = async (url, options) => {
    assert.equal(url.toString(), 'https://tegy-api.example.com/v1/deliverables/script-1/versions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.authorization, 'Bearer internal-version-token');
    assert.deepEqual(JSON.parse(options.body), { content: { script: { title: 'v2' } }, change_summary: 'Manual script edit' });
    return { status: 201, json: async () => ({ version: { version_number: 2 } }) };
  };
  try {
    const response = responseRecorder();
    await handler({ method: 'POST', query: { path: '/v1/deliverables/script-1/versions' }, body: { content: { script: { title: 'v2' } }, change_summary: 'Manual script edit' } }, response);
    assert.equal(response.statusCode, 201);
    assert.equal(response.payload.version.version_number, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.TEGY_API_URL; else process.env.TEGY_API_URL = originalUrl;
    if (originalToken === undefined) delete process.env.TEGY_API_TOKEN; else process.env.TEGY_API_TOKEN = originalToken;
  }
});

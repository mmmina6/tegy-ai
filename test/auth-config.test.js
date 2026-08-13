import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/auth-config.js';

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(payload) { this.payload = payload; return this; }
  };
}

test('auth config fails closed when Supabase is not configured', () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  const response = responseMock();
  handler({}, response);
  assert.equal(response.statusCode, 503);
  assert.match(response.payload.error, /not configured/i);
  if (previousUrl) process.env.SUPABASE_URL = previousUrl;
  if (previousKey) process.env.SUPABASE_ANON_KEY = previousKey;
});

test('auth config exposes only the browser-safe URL and publishable key', () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'publishable-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'must-not-leak';
  const response = responseMock();
  handler({}, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, {
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'publishable-key'
  });
  assert.doesNotMatch(JSON.stringify(response.payload), /must-not-leak/);
});

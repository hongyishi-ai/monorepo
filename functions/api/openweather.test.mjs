import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { onRequest } from './openweather.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('rejects disallowed OpenWeather paths without calling upstream', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response('{}');
  };

  const response = await onRequest({
    request: new Request('https://hongyishi.cn/api/openweather?path=/invalid'),
    env: { OPENWEATHER_API_KEY: 'server-key' },
  });

  assert.equal(response.status, 400);
  assert.equal(fetchCalled, false);
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('uses the server secret as the only appid sent upstream', async () => {
  let upstreamUrl;
  globalThis.fetch = async (url) => {
    upstreamUrl = new URL(url);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await onRequest({
    request: new Request(
      'https://hongyishi.cn/api/openweather?path=/data/2.5/weather&q=Beijing&appid=client-key',
    ),
    env: { OPENWEATHER_API_KEY: 'server-key' },
  });

  assert.equal(response.status, 200);
  assert.equal(upstreamUrl.searchParams.get('appid'), 'server-key');
  assert.deepEqual(upstreamUrl.searchParams.getAll('appid'), ['server-key']);
  assert.equal(upstreamUrl.searchParams.get('q'), 'Beijing');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=300, stale-while-revalidate=300');
});

test('answers CORS preflight with security headers', async () => {
  const response = await onRequest({
    request: new Request('https://hongyishi.cn/api/openweather', { method: 'OPTIONS' }),
    env: { OPENWEATHER_API_KEY: 'server-key' },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
});

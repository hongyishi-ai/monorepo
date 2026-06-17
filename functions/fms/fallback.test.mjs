import assert from 'node:assert/strict';
import { test } from 'node:test';

import { onRequest } from './[[catchall]].js';

function createAssetEnv(onFetch) {
  return {
    ASSETS: {
      fetch: async (input) => {
        const url = input instanceof URL ? input : new URL(typeof input === 'string' ? input : input.url);
        onFetch?.(url);
        return new Response('<!doctype html><div id="root"></div>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      },
    },
  };
}

test('redirects /fms to the canonical trailing-slash path', async () => {
  const response = await onRequest({
    request: new Request('https://hongyishi.cn/fms'),
    env: createAssetEnv(),
  });

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://hongyishi.cn/fms/');
});

test('serves FMS deep links from the app shell with status 200', async () => {
  let fetchedPath;
  const response = await onRequest({
    request: new Request('https://hongyishi.cn/fms/report/123?debug=true'),
    env: createAssetEnv((url) => {
      fetchedPath = `${url.pathname}${url.search}`;
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(fetchedPath, '/fms/');
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
});

test('passes FMS static assets through unchanged', async () => {
  let fetchedPath;
  const response = await onRequest({
    request: new Request('https://hongyishi.cn/fms/assets/app.js?v=1'),
    env: createAssetEnv((url) => {
      fetchedPath = `${url.pathname}${url.search}`;
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(fetchedPath, '/fms/assets/app.js?v=1');
});

test('rejects unsupported methods for the FMS fallback route', async () => {
  const response = await onRequest({
    request: new Request('https://hongyishi.cn/fms/report', { method: 'POST' }),
    env: createAssetEnv(),
  });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
});

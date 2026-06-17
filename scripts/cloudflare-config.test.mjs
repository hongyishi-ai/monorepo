import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

test('wrangler Pages config tracks the unified Cloudflare output directory', async () => {
  const wranglerConfig = await readJson('wrangler.jsonc');

  assert.equal(wranglerConfig.name, 'hongyishi-monorepo');
  assert.equal(wranglerConfig.compatibility_date, '2026-06-16');
  assert.equal(wranglerConfig.pages_build_output_dir, '.cloudflare/site');
  assert.equal('main' in wranglerConfig, false, 'Pages config should not define a Workers main entry');
});

test('preview script serves the same Pages output directory as wrangler config', async () => {
  const rootPackage = await readJson('package.json');
  const wranglerConfig = await readJson('wrangler.jsonc');
  const previewScript = rootPackage.scripts['preview:cloudflare'];

  assert.match(previewScript, /wrangler pages dev/);
  assert.match(previewScript, new RegExp(wranglerConfig.pages_build_output_dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(previewScript, new RegExp(`--compatibility-date=${wranglerConfig.compatibility_date}`));
});

test('FMS Sentry monitoring is explicit opt-in for the free-tier build', async () => {
  const source = await readFile(path.join(repoRoot, 'apps', 'fms', 'src', 'lib', 'sentry.ts'), 'utf8');

  assert.match(source, /const sentryDsn = import\.meta\.env\.VITE_SENTRY_DSN/);
  assert.match(source, /if \(!sentryDsn\)/);
  assert.doesNotMatch(source, /tracesSampleRate:\s*import\.meta\.env\.PROD\s*\?\s*0\.1\s*:\s*1\.0/);
});

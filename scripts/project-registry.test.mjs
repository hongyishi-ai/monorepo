import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildHeaders, buildRedirects } from './build-cloudflare.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(repoRoot, 'apps', 'portal', 'src', 'lib', 'projects.json');
const taskEntriesPath = path.join(repoRoot, 'apps', 'portal', 'src', 'lib', 'task-entries.json');
const publicDir = path.join(repoRoot, 'apps', 'portal', 'public');

const allowedColors = new Set(['red', 'blue', 'yellow', 'gray']);
const allowedStatuses = new Set(['integrated', 'external', 'planned']);
const allowedContentStatuses = new Set(['current', 'review-required', 'reference-only']);
const allowedTaskUrgencies = new Set(['immediate', 'guided', 'lookup', 'local']);
const integratedProjectPaths = new Set(['/fms/', '/heat-stroke/', '/tccc/']);

async function readRegistry() {
  return JSON.parse(await readFile(registryPath, 'utf8'));
}

async function readTaskEntries() {
  return JSON.parse(await readFile(taskEntriesPath, 'utf8'));
}

function allEntries(registry) {
  return [...registry.platformProjects, ...registry.auxiliaryEntries];
}

async function assertPublicAssetExists(assetPath, projectId, fieldName) {
  assert.match(assetPath, /^\//, `${projectId}.${fieldName} should be root-relative`);
  assert.doesNotMatch(assetPath, /\s/, `${projectId}.${fieldName} should not contain spaces`);
  await access(path.join(publicDir, assetPath.replace(/^\//, '')));
}

test('project registry entries use stable ids, colors, statuses, and paths', async () => {
  const registry = await readRegistry();
  const entries = allEntries(registry);
  const ids = new Set();

  assert.ok(registry.platformProjects.length >= 4, 'expected primary platform project entries');
  assert.ok(entries.length >= registry.platformProjects.length, 'expected auxiliary entries to merge with platform entries');

  for (const project of entries) {
    assert.match(project.id, /^[a-z0-9-]+$/, `${project.id} should be URL-safe lowercase kebab-case`);
    assert.equal(ids.has(project.id), false, `${project.id} should be unique`);
    ids.add(project.id);

    assert.ok(project.title, `${project.id} should have a title`);
    assert.ok(project.shortTitle, `${project.id} should have a short title`);
    assert.ok(project.description, `${project.id} should have a description`);
    assert.ok(allowedColors.has(project.color), `${project.id} should use an allowed brand color`);
    assert.ok(allowedStatuses.has(project.status), `${project.id} should use an allowed status`);

    if (project.status === 'integrated') {
      assert.match(project.href, /^\/[a-z0-9-]+\/$/, `${project.id} should use an internal base path`);
    } else if (project.status === 'external') {
      assert.match(project.href, /^https:\/\//, `${project.id} external entries should use HTTPS`);
    }
  }
});

test('project registry assets exist in portal public assets', async () => {
  const registry = await readRegistry();

  for (const project of allEntries(registry)) {
    await assertPublicAssetExists(project.logo, project.id, 'logo');
  }

  for (const project of registry.platformProjects) {
    assert.ok(project.coverImage, `${project.id} should define coverImage`);
    await assertPublicAssetExists(project.coverImage, project.id, 'coverImage');
  }
});

test('integrated projects are represented in the Cloudflare single-site build contract', async () => {
  const registry = await readRegistry();
  const redirects = buildRedirects();
  const headers = buildHeaders();

  for (const project of registry.platformProjects.filter((entry) => entry.status === 'integrated')) {
    assert.ok(
      integratedProjectPaths.has(project.href),
      `${project.id} at ${project.href} must be added to scripts/project-registry.test.mjs and build-cloudflare.mjs`,
    );
    assert.match(redirects, new RegExp(`${project.href.replace(/\/$/, '')}\\s+${project.href}\\s+301`));

    if (project.id === 'tccc') {
      assert.match(headers, /\/tccc\/assets\/\*/);
      assert.match(headers, /\/tccc\/icons\/\*/);
      assert.match(headers, /\/tccc\/images\/\*/);
      assert.match(headers, /\/tccc\/videos\/\*/);
    } else {
      assert.match(headers, new RegExp(`${project.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}assets/\\*`));
    }
  }
});

test('project registry entries expose content credibility metadata', async () => {
  const registry = await readRegistry();

  for (const project of registry.platformProjects) {
    assert.ok(project.content, `${project.id} should define content metadata`);
    assert.ok(project.content.sourceName, `${project.id}.content.sourceName should be present`);
    assert.ok(project.content.version, `${project.id}.content.version should be present`);
    assert.match(project.content.reviewedAt, /^\d{4}-\d{2}-\d{2}$/, `${project.id}.content.reviewedAt should be ISO date`);
    assert.ok(project.content.audience, `${project.id}.content.audience should be present`);
    assert.ok(project.content.disclaimer, `${project.id}.content.disclaimer should be present`);
    assert.ok(
      allowedContentStatuses.has(project.content.status),
      `${project.id}.content.status should use an allowed status`,
    );

    if (project.status === 'integrated') {
      assert.ok(project.content.entryLabel, `${project.id}.content.entryLabel should explain the task entry`);
      assert.ok(project.content.dataPolicy, `${project.id}.content.dataPolicy should explain local data handling`);
    }
  }

  const tccc = registry.platformProjects.find((project) => project.id === 'tccc');
  assert.equal(tccc.content.status, 'review-required', 'TCCC content should require current-source review');
  assert.match(tccc.content.version, /2017/, 'TCCC content version should expose the inherited 2017 baseline');
  assert.match(tccc.content.officialUpdateUrl, /^https:\/\//, 'TCCC content should link to an official update path');
});

test('portal task entries are task-first and map to integrated projects', async () => {
  const registry = await readRegistry();
  const taskEntries = await readTaskEntries();
  const integratedIds = new Set(
    registry.platformProjects.filter((project) => project.status === 'integrated').map((project) => project.id),
  );
  const expectedIds = new Set(['heat-field-action', 'fms-assessment', 'tccc-flow', 'local-records']);
  const actualIds = new Set();

  assert.ok(taskEntries.length >= expectedIds.size, 'expected task-first portal entries');

  for (const entry of taskEntries) {
    assert.match(entry.id, /^[a-z0-9-]+$/, `${entry.id} should be URL-safe lowercase kebab-case`);
    actualIds.add(entry.id);
    assert.ok(expectedIds.has(entry.id), `${entry.id} should be an approved platform task`);
    assert.ok(integratedIds.has(entry.projectId), `${entry.id} should map to an integrated project`);
    assert.match(entry.href, /^\/[a-z0-9-]+\/[^?#]*$/, `${entry.id} should use an internal product route`);
    assert.ok(entry.label, `${entry.id} should have a label`);
    assert.ok(entry.intent, `${entry.id} should describe the user intent`);
    assert.ok(entry.sourceNote, `${entry.id} should expose source/version context`);
    assert.ok(allowedTaskUrgencies.has(entry.urgency), `${entry.id} should use an allowed urgency`);
  }

  for (const id of expectedIds) {
    assert.ok(actualIds.has(id), `missing task entry ${id}`);
  }
});

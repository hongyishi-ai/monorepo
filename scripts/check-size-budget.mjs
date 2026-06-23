#!/usr/bin/env node

import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(repoRoot, '.cloudflare', 'site');

const MiB = 1024 * 1024;

const budgets = {
  maxTotalBytes: 80 * MiB,
  maxFileBytes: 5 * MiB,
  maxFmsPrecacheBytes: 24 * MiB,
  allowLargeFiles: new Map([
    ['tccc/videos/02_io_access_technique.mp4', 12 * MiB],
  ]),
};

function formatBytes(bytes) {
  return `${(bytes / MiB).toFixed(2)} MiB`;
}

async function collectFiles(rootDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const fileStat = await stat(absolutePath);
      files.push({
        absolutePath,
        relativePath: path.relative(rootDir, absolutePath).split(path.sep).join('/'),
        bytes: fileStat.size,
      });
    }
  }

  await walk(rootDir);
  return files;
}

function extractPrecacheUrls(serviceWorkerSource) {
  const urls = new Set();
  const matches = serviceWorkerSource.matchAll(/\{\s*url:\s*["']([^"']+)["']\s*,\s*revision:/g);

  for (const match of matches) {
    urls.add(match[1].replace(/^\.\//, ''));
  }

  return urls;
}

async function main() {
  let siteStat;
  try {
    siteStat = await stat(siteDir);
  } catch {
    throw new Error(`Missing Cloudflare output directory: ${path.relative(repoRoot, siteDir)}. Run pnpm build:cloudflare first.`);
  }

  if (!siteStat.isDirectory()) {
    throw new Error(`${path.relative(repoRoot, siteDir)} is not a directory`);
  }

  const files = await collectFiles(siteDir);
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const fileByRelativePath = new Map(files.map((file) => [file.relativePath, file]));
  const failures = [];

  if (totalBytes > budgets.maxTotalBytes) {
    failures.push(`Pages output total ${formatBytes(totalBytes)} exceeds ${formatBytes(budgets.maxTotalBytes)}`);
  }

  for (const file of files) {
    const allowedBytes = budgets.allowLargeFiles.get(file.relativePath);
    const maxBytes = allowedBytes ?? budgets.maxFileBytes;

    if (file.bytes > maxBytes) {
      failures.push(`${file.relativePath} is ${formatBytes(file.bytes)}, exceeds ${formatBytes(maxBytes)}`);
    }
  }

  const fmsServiceWorker = fileByRelativePath.get('fms/sw.js');
  if (fmsServiceWorker) {
    const source = await readFile(fmsServiceWorker.absolutePath, 'utf8');
    const urls = extractPrecacheUrls(source);
    let precacheBytes = 0;

    for (const url of urls) {
      const normalizedUrl = url.replace(/^\/fms\//, 'fms/').replace(/^\//, '');
      const file = fileByRelativePath.get(normalizedUrl);
      if (file) {
        precacheBytes += file.bytes;
      }
    }

    if (precacheBytes > budgets.maxFmsPrecacheBytes) {
      failures.push(`FMS precache ${formatBytes(precacheBytes)} exceeds ${formatBytes(budgets.maxFmsPrecacheBytes)}`);
    }
  }

  if (failures.length > 0) {
    console.error('Size budget failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Size budget passed: ${files.length} files, ${formatBytes(totalBytes)} total`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

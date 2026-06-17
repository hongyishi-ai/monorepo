import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = path.join(repoRoot, 'packages', 'ui', 'src', 'brand', 'tokens.json');
const variablesPath = path.join(repoRoot, 'packages', 'ui', 'src', 'styles', 'variables.css');

function kebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

test('Hongyishi brand CSS variables mirror the shared token source', async () => {
  const tokens = JSON.parse(await readFile(tokensPath, 'utf8'));
  const variables = await readFile(variablesPath, 'utf8');

  for (const [name, value] of Object.entries(tokens.colors)) {
    assert.match(
      variables,
      new RegExp(`--hys-color-${kebabCase(name)}:\\s*${value.replace('#', '\\#')};`),
      `missing CSS variable for colors.${name}`,
    );
  }

  for (const [name, value] of Object.entries(tokens.radius)) {
    assert.match(
      variables,
      new RegExp(`--hys-radius-${kebabCase(name)}:\\s*${value};`),
      `missing CSS variable for radius.${name}`,
    );
  }
});

test('Hongyishi shared token source keeps required brand families', async () => {
  const tokens = JSON.parse(await readFile(tokensPath, 'utf8'));

  assert.equal(tokens.colors.constructivismRed, '#D93025');
  assert.equal(tokens.colors.fieldNavy, '#12313C');
  assert.equal(tokens.colors.agedPaper, '#F4ECDC');
  assert.deepEqual(tokens.typography.mono.slice(0, 2), ['Roboto Mono', 'ui-monospace']);
  assert.deepEqual(tokens.typography.display.slice(0, 2), ['Bebas Neue', 'Impact']);
});

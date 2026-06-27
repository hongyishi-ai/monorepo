import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const require = createRequire(import.meta.url);
const tokensPath = path.join(
  repoRoot,
  "packages",
  "config",
  "brand",
  "tokens.json",
);
const variablesPath = path.join(
  repoRoot,
  "packages",
  "ui",
  "src",
  "styles",
  "variables.css",
);
const brandIndexPath = path.join(
  repoRoot,
  "packages",
  "ui",
  "src",
  "brand",
  "index.ts",
);
const tailwindPresetPath = path.join(
  repoRoot,
  "packages",
  "config",
  "tailwind",
  "index.cjs",
);
const tailwindConsumerPaths = [
  path.join(repoRoot, "apps", "portal", "tailwind.config.ts"),
  path.join(repoRoot, "apps", "fms", "tailwind.config.js"),
  path.join(repoRoot, "apps", "heat-stroke", "tailwind.config.cjs"),
  path.join(repoRoot, "apps", "tccc", "tailwind.config.cjs"),
  path.join(repoRoot, "packages", "ui", "tailwind.config.js"),
];

function kebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

test("Hongyishi brand CSS variables mirror the shared token source", async () => {
  const tokens = JSON.parse(await readFile(tokensPath, "utf8"));
  const variables = await readFile(variablesPath, "utf8");

  for (const [name, value] of Object.entries(tokens.colors)) {
    assert.match(
      variables,
      new RegExp(
        `--hys-color-${kebabCase(name)}:\\s*${value.replace("#", "\\#")};`,
      ),
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

test("Hongyishi shared token source keeps required brand families", async () => {
  const tokens = JSON.parse(await readFile(tokensPath, "utf8"));

  assert.equal(tokens.colors.constructivismRed, "#D93025");
  assert.equal(tokens.colors.fieldNavy, "#12313C");
  assert.equal(tokens.colors.agedPaper, "#F4ECDC");
  assert.deepEqual(tokens.typography.mono.slice(0, 2), [
    "Roboto Mono",
    "ui-monospace",
  ]);
  assert.deepEqual(tokens.typography.display.slice(0, 2), [
    "Bebas Neue",
    "Impact",
  ]);
});

test("Hongyishi shared Tailwind preset exposes brand tokens", async () => {
  await assert.doesNotReject(
    () => access(tailwindPresetPath),
    "expected shared Tailwind preset at packages/config/tailwind/index.cjs",
  );

  const tokens = JSON.parse(await readFile(tokensPath, "utf8"));
  const preset = require(tailwindPresetPath);
  const colors = preset.theme.extend.colors.hongyishi;
  const radii = preset.theme.extend.borderRadius;
  const fonts = preset.theme.extend.fontFamily;

  assert.equal(
    colors.red,
    `var(--hys-color-constructivism-red, ${tokens.colors.constructivismRed})`,
  );
  assert.equal(
    colors["field-red"],
    `var(--hys-color-field-red, ${tokens.colors.fieldRed})`,
  );
  assert.equal(
    colors.orange,
    `var(--hys-color-signal-orange, ${tokens.colors.signalOrange})`,
  );
  assert.equal(
    colors.blue,
    `var(--hys-color-technology-blue, ${tokens.colors.technologyBlue})`,
  );
  assert.equal(
    colors.cyan,
    `var(--hys-color-clinical-cyan, ${tokens.colors.clinicalCyan})`,
  );
  assert.equal(
    colors.navy,
    `var(--hys-color-field-navy, ${tokens.colors.fieldNavy})`,
  );
  assert.equal(
    colors.yellow,
    `var(--hys-color-structure-yellow, ${tokens.colors.structureYellow})`,
  );
  assert.equal(colors.ink, `var(--hys-color-ink, ${tokens.colors.ink})`);
  assert.equal(colors.paper, `var(--hys-color-paper, ${tokens.colors.paper})`);
  assert.equal(
    colors["aged-paper"],
    `var(--hys-color-aged-paper, ${tokens.colors.agedPaper})`,
  );
  assert.equal(colors.muted, `var(--hys-color-muted, ${tokens.colors.muted})`);
  assert.equal(
    radii["hys-card"],
    `var(--hys-radius-card, ${tokens.radius.card})`,
  );
  assert.equal(
    radii["hys-control"],
    `var(--hys-radius-control, ${tokens.radius.control})`,
  );
  assert.deepEqual(fonts.sans, tokens.typography.sans);
  assert.deepEqual(fonts.mono, tokens.typography.mono);
  assert.deepEqual(fonts.display, tokens.typography.display);
});

test("Tailwind workspace configs consume the shared Hongyishi preset", async () => {
  for (const configPath of tailwindConsumerPaths) {
    const config = await readFile(configPath, "utf8");
    assert.match(
      config,
      /@hongyishi\/config\/tailwind/,
      `${path.relative(repoRoot, configPath)} should use @hongyishi/config/tailwind`,
    );
    assert.match(
      config,
      /\bpresets\s*:/,
      `${path.relative(repoRoot, configPath)} should declare a Tailwind presets array`,
    );
  }
});

test("Hongyishi platform paths include every integrated app base path", async () => {
  const brandIndex = await readFile(brandIndexPath, "utf8");

  assert.match(brandIndex, /home:\s*["']\/["']/);
  assert.match(brandIndex, /fms:\s*["']\/fms\/["']/);
  assert.match(brandIndex, /heatStroke:\s*["']\/heat-stroke\/["']/);
  assert.match(brandIndex, /tccc:\s*["']\/tccc\/["']/);
});

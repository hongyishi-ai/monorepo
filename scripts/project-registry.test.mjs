import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCloudflareBasePathsFromRegistry,
  buildHeaders,
  buildRedirects,
} from "./build-cloudflare.mjs";
import {
  buildMobileNavAuditExpectations,
  buildRepresentativeRoutesFromRegistry,
} from "./audit-links.mjs";
import {
  mobileNavConfigs,
  resolveMobileNavItems,
  resolveProjectMobileActiveTab,
  resolveProjectMobileMenuActiveItem,
} from "../packages/config/app-shell/mobile-nav.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const registryPath = path.join(
  repoRoot,
  "apps",
  "portal",
  "src",
  "lib",
  "projects.json",
);
const taskEntriesPath = path.join(
  repoRoot,
  "apps",
  "portal",
  "src",
  "lib",
  "task-entries.json",
);
const configPackagePath = path.join(
  repoRoot,
  "packages",
  "config",
  "package.json",
);
const publicDir = path.join(repoRoot, "apps", "portal", "public");

const allowedColors = new Set(["red", "blue", "yellow", "gray"]);
const allowedStatuses = new Set(["integrated", "external", "planned"]);
const allowedContentStatuses = new Set([
  "current",
  "review-required",
  "reference-only",
]);
const allowedTaskUrgencies = new Set([
  "immediate",
  "guided",
  "lookup",
  "local",
]);
async function readRegistry() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

async function readTaskEntries() {
  return JSON.parse(await readFile(taskEntriesPath, "utf8"));
}

function allEntries(registry) {
  return [...registry.platformProjects, ...registry.auxiliaryEntries];
}

async function assertPublicAssetExists(assetPath, projectId, fieldName) {
  assert.match(
    assetPath,
    /^\//,
    `${projectId}.${fieldName} should be root-relative`,
  );
  assert.doesNotMatch(
    assetPath,
    /\s/,
    `${projectId}.${fieldName} should not contain spaces`,
  );
  await access(path.join(publicDir, assetPath.replace(/^\//, "")));
}

test("project registry entries use stable ids, colors, statuses, and paths", async () => {
  const registry = await readRegistry();
  const entries = allEntries(registry);
  const ids = new Set();
  const platformIds = registry.platformProjects
    .map((project) => project.id)
    .sort();

  assert.deepEqual(
    platformIds,
    ["fms", "heat-stroke", "tccc"],
    "expected current platform project entries",
  );
  assert.ok(
    entries.length >= registry.platformProjects.length,
    "expected auxiliary entries to merge with platform entries",
  );

  for (const project of entries) {
    assert.match(
      project.id,
      /^[a-z0-9-]+$/,
      `${project.id} should be URL-safe lowercase kebab-case`,
    );
    assert.equal(ids.has(project.id), false, `${project.id} should be unique`);
    ids.add(project.id);

    assert.ok(project.title, `${project.id} should have a title`);
    assert.ok(project.shortTitle, `${project.id} should have a short title`);
    assert.ok(project.description, `${project.id} should have a description`);
    assert.ok(
      allowedColors.has(project.color),
      `${project.id} should use an allowed brand color`,
    );
    assert.ok(
      allowedStatuses.has(project.status),
      `${project.id} should use an allowed status`,
    );

    if (project.status === "integrated") {
      assert.match(
        project.href,
        /^\/[a-z0-9-]+\/$/,
        `${project.id} should use an internal base path`,
      );
    } else if (project.status === "external") {
      assert.match(
        project.href,
        /^https:\/\//,
        `${project.id} external entries should use HTTPS`,
      );
    }
  }
});

test("project registry assets exist in portal public assets", async () => {
  const registry = await readRegistry();

  for (const project of allEntries(registry)) {
    await assertPublicAssetExists(project.logo, project.id, "logo");
  }

  for (const project of registry.platformProjects) {
    assert.ok(project.coverImage, `${project.id} should define coverImage`);
    await assertPublicAssetExists(project.coverImage, project.id, "coverImage");
  }
});

test("integrated projects are represented in the Cloudflare single-site build contract", async () => {
  const registry = await readRegistry();
  const redirects = buildRedirects();
  const headers = buildHeaders();
  const integratedProjectPaths = new Set(
    Object.values(buildCloudflareBasePathsFromRegistry(registry)),
  );

  for (const project of registry.platformProjects.filter(
    (entry) => entry.status === "integrated",
  )) {
    assert.ok(
      integratedProjectPaths.has(project.href),
      `${project.id} at ${project.href} must be added to scripts/project-registry.test.mjs and build-cloudflare.mjs`,
    );
    assert.match(
      redirects,
      new RegExp(
        `${project.href.replace(/\/$/, "")}\\s+${project.href}\\s+301`,
      ),
    );

    if (project.id === "tccc") {
      assert.match(headers, /\/tccc\/assets\/\*/);
      assert.match(headers, /\/tccc\/icons\/\*/);
      assert.match(headers, /\/tccc\/images\/\*/);
      assert.match(headers, /\/tccc\/videos\/\*/);
    } else {
      assert.match(
        headers,
        new RegExp(
          `${project.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}assets/\\*`,
        ),
      );
    }
  }
});

test("link audit representative project roots are derived from the project registry", async () => {
  const registry = await readRegistry();
  const remappedRegistry = structuredClone(registry);
  const remappedPaths = {
    fms: "/training-injury/",
    "heat-stroke": "/heat-defense/",
    tccc: "/combat-care/",
  };

  for (const project of remappedRegistry.platformProjects) {
    if (remappedPaths[project.id]) {
      project.href = remappedPaths[project.id];
    }
  }

  const routes = buildRepresentativeRoutesFromRegistry(remappedRegistry);

  assert.ok(routes.includes("/training-injury/"));
  assert.ok(routes.includes("/training-injury/assessment"));
  assert.ok(routes.includes("/heat-defense/"));
  assert.ok(routes.includes("/heat-defense/pages/field-treatment"));
  assert.ok(routes.includes("/combat-care/"));
  assert.ok(routes.includes("/combat-care/pages/tccc-standard"));
  assert.equal(routes.includes("/fms/"), false);
  assert.equal(routes.includes("/heat-stroke/"), false);
  assert.equal(routes.includes("/tccc/"), false);
});

test("link audit mobile nav expectations reuse shared app shell mobile nav config", async () => {
  const expectations = buildMobileNavAuditExpectations();
  const platformHome = expectations.find((item) => item.path === "/");
  const heatStrokeHome = expectations.find(
    (item) => item.path === "/heat-stroke/",
  );
  const tcccHome = expectations.find((item) => item.path === "/tccc/");
  const heatStrokeBottom = resolveMobileNavItems("heatStroke", "/heat-stroke/");
  const heatStrokeMenu = resolveMobileNavItems("heatStroke", "/heat-stroke/", {
    surface: "menu",
  });
  const tcccBottom = resolveMobileNavItems("tccc", "/tccc/");
  const tcccMenu = resolveMobileNavItems("tccc", "/tccc/", {
    surface: "menu",
  });
  const buildSource = await readFile(
    path.join(repoRoot, "scripts", "build-cloudflare.mjs"),
    "utf8",
  );
  const configPackage = JSON.parse(await readFile(configPackagePath, "utf8"));

  assert.deepEqual(
    platformHome.requiredLabels,
    mobileNavConfigs.platform.tabs.map((tab) => tab.label),
  );
  assert.deepEqual(
    heatStrokeHome.requiredHrefs,
    heatStrokeBottom.map((tab) => tab.href),
  );
  assert.deepEqual(
    heatStrokeHome.expectedTopMenuHrefs,
    heatStrokeMenu.map((tab) => tab.href),
  );
  assert.deepEqual(
    heatStrokeHome.expectedTopMenuLabels,
    heatStrokeMenu.map((tab) => tab.label),
  );
  assert.deepEqual(
    tcccHome.requiredHrefs,
    tcccBottom.map((tab) => tab.href),
  );
  assert.deepEqual(
    tcccHome.expectedTopMenuHrefs,
    tcccMenu.map((tab) => tab.href),
  );
  assert.deepEqual(
    tcccHome.expectedTopMenuLabels,
    tcccMenu.map((tab) => tab.label),
  );
  assert.doesNotMatch(buildSource, /export const mobileNavConfigs/);
  assert.doesNotMatch(buildSource, /export function resolveMobileNavItems/);
  assert.equal(
    configPackage.exports["./app-shell/mobile-nav"],
    "./app-shell/mobile-nav.mjs",
  );
});

test("static project mobile active states are resolved by the shared app shell config", async () => {
  const buildSource = await readFile(
    path.join(repoRoot, "scripts", "build-cloudflare.mjs"),
    "utf8",
  );

  assert.equal(
    resolveProjectMobileActiveTab("heatStroke", "pages/heat-index.html"),
    "heat-index",
  );
  assert.equal(
    resolveProjectMobileActiveTab("heatStroke", "index.html"),
    "library",
  );
  assert.equal(
    resolveProjectMobileActiveTab("tccc", "pages/tfc-airway.html"),
    "tfc",
  );
  assert.equal(
    resolveProjectMobileActiveTab("tccc", "pages/tacevac-airway.html"),
    "tacevac",
  );
  assert.equal(
    resolveProjectMobileMenuActiveItem(
      "heatStroke",
      "pages/diagnosis-treatment-guideline.html",
    ),
    "guide",
  );
  assert.equal(
    resolveProjectMobileMenuActiveItem(
      "heatStroke",
      "pages/core-temperature-cooling.html",
    ),
    "cooling",
  );
  assert.equal(
    resolveProjectMobileMenuActiveItem("tccc", "pages/tfc-airway.html"),
    "airway",
  );
  assert.equal(
    resolveProjectMobileMenuActiveItem(
      "tccc",
      "pages/tccc-flow-framework.html",
    ),
    "course",
  );
  assert.doesNotMatch(buildSource, /function resolveHeatStrokeMenuActiveItem/);
  assert.doesNotMatch(buildSource, /function resolveTcccMenuActiveItem/);
  assert.doesNotMatch(
    buildSource,
    /export function resolveProjectMobileActiveTab/,
  );
});

test("project registry entries expose content credibility metadata", async () => {
  const registry = await readRegistry();

  for (const project of registry.platformProjects) {
    assert.ok(project.content, `${project.id} should define content metadata`);
    assert.ok(
      project.content.sourceName,
      `${project.id}.content.sourceName should be present`,
    );
    assert.ok(
      project.content.version,
      `${project.id}.content.version should be present`,
    );
    assert.match(
      project.content.reviewedAt,
      /^\d{4}-\d{2}-\d{2}$/,
      `${project.id}.content.reviewedAt should be ISO date`,
    );
    assert.ok(
      project.content.audience,
      `${project.id}.content.audience should be present`,
    );
    assert.ok(
      project.content.disclaimer,
      `${project.id}.content.disclaimer should be present`,
    );
    assert.ok(
      allowedContentStatuses.has(project.content.status),
      `${project.id}.content.status should use an allowed status`,
    );

    if (project.status === "integrated") {
      assert.ok(
        project.content.entryLabel,
        `${project.id}.content.entryLabel should explain the task entry`,
      );
      assert.ok(
        project.content.dataPolicy,
        `${project.id}.content.dataPolicy should explain local data handling`,
      );
    }
  }

  const tccc = registry.platformProjects.find(
    (project) => project.id === "tccc",
  );
  assert.equal(
    tccc.content.status,
    "review-required",
    "TCCC content should require current-source review",
  );
  assert.match(
    tccc.content.version,
    /2017/,
    "TCCC content version should expose the inherited 2017 baseline",
  );
  assert.match(
    tccc.content.officialUpdateUrl,
    /^https:\/\//,
    "TCCC content should link to an official update path",
  );
});

test("portal task entries are task-first and map to integrated projects", async () => {
  const registry = await readRegistry();
  const taskEntries = await readTaskEntries();
  const integratedIds = new Set(
    registry.platformProjects
      .filter((project) => project.status === "integrated")
      .map((project) => project.id),
  );
  const expectedIds = new Set([
    "heat-field-action",
    "fms-assessment",
    "tccc-flow",
    "local-records",
  ]);
  const actualIds = new Set();

  assert.ok(
    taskEntries.length >= expectedIds.size,
    "expected task-first portal entries",
  );

  for (const entry of taskEntries) {
    assert.match(
      entry.id,
      /^[a-z0-9-]+$/,
      `${entry.id} should be URL-safe lowercase kebab-case`,
    );
    actualIds.add(entry.id);
    assert.ok(
      expectedIds.has(entry.id),
      `${entry.id} should be an approved platform task`,
    );
    assert.ok(
      integratedIds.has(entry.projectId),
      `${entry.id} should map to an integrated project`,
    );
    assert.match(
      entry.href,
      /^\/[a-z0-9-]+\/[^?#]*$/,
      `${entry.id} should use an internal product route`,
    );
    assert.ok(entry.label, `${entry.id} should have a label`);
    assert.ok(entry.intent, `${entry.id} should describe the user intent`);
    assert.ok(
      entry.sourceNote,
      `${entry.id} should expose source/version context`,
    );
    assert.ok(
      allowedTaskUrgencies.has(entry.urgency),
      `${entry.id} should use an allowed urgency`,
    );
  }

  for (const id of expectedIds) {
    assert.ok(actualIds.has(id), `missing task entry ${id}`);
  }
});

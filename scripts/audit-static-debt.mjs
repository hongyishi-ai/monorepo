import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const defaultStaticDebtProjects = [
  { id: "heat-stroke", root: path.join(repoRoot, "apps", "heat-stroke") },
  { id: "tccc", root: path.join(repoRoot, "apps", "tccc") },
];

export const defaultStaticDebtBaselines = {
  "heat-stroke": {
    styleBlockCount: 1,
    styleAttributeCount: 0,
    legacyHomeLinkCount: 0,
  },
  tccc: {
    styleBlockCount: 26,
    styleAttributeCount: 25,
    legacyHomeLinkCount: 0,
  },
};

const htmlExtension = ".html";
const legacyHomeLinkPattern =
  /\bhref=(["'])(?:\.\.\/index\.html|index\.html)\1/gi;

async function collectHtmlFiles(directory, baseDir = directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(absolutePath, baseDir)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(htmlExtension)) {
      files.push({
        absolutePath,
        relativePath: path
          .relative(baseDir, absolutePath)
          .split(path.sep)
          .join("/"),
      });
    }
  }

  return files;
}

function countMatches(content, pattern) {
  return Array.from(content.matchAll(pattern)).length;
}

export async function collectStaticDebt(projectRoot) {
  const htmlFiles = await collectHtmlFiles(projectRoot);
  const debt = {
    htmlFiles: htmlFiles.length,
    htmlWithStyleBlocks: 0,
    styleBlockCount: 0,
    htmlWithStyleAttributes: 0,
    styleAttributeCount: 0,
    legacyHomeLinkCount: 0,
    legacyHomeLinkFiles: [],
  };

  for (const file of htmlFiles) {
    const content = await readFile(file.absolutePath, "utf8");
    const styleBlockCount = countMatches(content, /<style\b/gi);
    const styleAttributeCount = countMatches(content, /\sstyle=(["'])/gi);
    const legacyHomeLinkCount = countMatches(content, legacyHomeLinkPattern);

    debt.styleBlockCount += styleBlockCount;
    debt.styleAttributeCount += styleAttributeCount;
    debt.legacyHomeLinkCount += legacyHomeLinkCount;

    if (styleBlockCount > 0) {
      debt.htmlWithStyleBlocks += 1;
    }

    if (styleAttributeCount > 0) {
      debt.htmlWithStyleAttributes += 1;
    }

    if (legacyHomeLinkCount > 0) {
      debt.legacyHomeLinkFiles.push(file.relativePath);
    }
  }

  return debt;
}

export async function auditStaticDebt(options = {}) {
  const projects = options.projects ?? defaultStaticDebtProjects;
  const baselines = options.baselines ?? defaultStaticDebtBaselines;
  const results = [];
  const failures = [];

  for (const project of projects) {
    const debt = await collectStaticDebt(project.root);
    results.push([project.id, debt]);

    const baseline = baselines[project.id] ?? {};
    for (const metric of [
      "styleBlockCount",
      "styleAttributeCount",
      "legacyHomeLinkCount",
    ]) {
      if (baseline[metric] !== undefined && debt[metric] > baseline[metric]) {
        failures.push({
          projectId: project.id,
          metric,
          actual: debt[metric],
          allowed: baseline[metric],
        });
      }
    }
  }

  return {
    ok: failures.length === 0,
    projects: results,
    failures,
  };
}

export function summarizeStaticDebt(result) {
  const lines = ["Static HTML debt audit"];

  for (const [projectId, debt] of result.projects) {
    lines.push(
      [
        `- ${projectId}:`,
        `${debt.htmlFiles} HTML files,`,
        `style blocks: ${debt.styleBlockCount}`,
        `(${debt.htmlWithStyleBlocks} files),`,
        `style attrs: ${debt.styleAttributeCount}`,
        `(${debt.htmlWithStyleAttributes} files),`,
        `legacy home links: ${debt.legacyHomeLinkCount}`,
      ].join(" "),
    );

    if (debt.legacyHomeLinkFiles.length > 0) {
      lines.push(`  legacy files: ${debt.legacyHomeLinkFiles.join(", ")}`);
    }
  }

  if (result.failures.length > 0) {
    lines.push("Failures:");
    for (const failure of result.failures) {
      lines.push(
        `- ${failure.projectId}.${failure.metric}: ${failure.actual} > ${failure.allowed}`,
      );
    }
  }

  return lines.join("\n");
}

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  const result = await auditStaticDebt();
  const json = process.argv.includes("--json");

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(summarizeStaticDebt(result));
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

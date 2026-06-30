import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { test } from "node:test";
import path from "node:path";

import {
  auditStaticDebt,
  collectStaticDebt,
  summarizeStaticDebt,
} from "./audit-static-debt.mjs";

test("collectStaticDebt counts inline style and legacy project-home links", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "hys-static-debt-"));
  await mkdir(path.join(root, "pages"), { recursive: true });
  await writeFile(
    path.join(root, "pages", "a.html"),
    '<style>.x{color:red}</style><a href="../index.html" style="color:red">首页</a>',
  );
  await writeFile(
    path.join(root, "pages", "b.html"),
    '<main><a href="/safe/">ok</a></main>',
  );
  await writeFile(path.join(root, "script.js"), "window.location.reload();");

  const debt = await collectStaticDebt(root);

  assert.equal(debt.htmlFiles, 2);
  assert.equal(debt.htmlWithStyleBlocks, 1);
  assert.equal(debt.styleBlockCount, 1);
  assert.equal(debt.htmlWithStyleAttributes, 1);
  assert.equal(debt.styleAttributeCount, 1);
  assert.equal(debt.legacyHomeLinkCount, 1);
  assert.deepEqual(debt.legacyHomeLinkFiles, ["pages/a.html"]);
});

test("auditStaticDebt fails when a project exceeds its explicit baseline", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "hys-static-debt-"));
  await writeFile(
    path.join(root, "index.html"),
    '<style>.x{color:red}</style><a href="index.html">首页</a>',
  );

  const result = await auditStaticDebt({
    projects: [{ id: "fixture", root }],
    baselines: {
      fixture: {
        styleBlockCount: 0,
        styleAttributeCount: 0,
        legacyHomeLinkCount: 0,
      },
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.failures.map((failure) => failure.metric),
    ["styleBlockCount", "legacyHomeLinkCount"],
  );
});

test("summarizeStaticDebt returns a stable compact report", () => {
  const summary = summarizeStaticDebt({
    ok: true,
    projects: [
      [
        "fixture",
        {
          htmlFiles: 2,
          htmlWithStyleBlocks: 1,
          styleBlockCount: 1,
          htmlWithStyleAttributes: 1,
          styleAttributeCount: 3,
          legacyHomeLinkCount: 0,
          legacyHomeLinkFiles: [],
        },
      ],
    ],
    failures: [],
  });

  assert.match(summary, /fixture/);
  assert.match(summary, /style blocks: 1/);
  assert.match(summary, /style attrs: 3/);
  assert.match(summary, /legacy home links: 0/);
});

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("dashboard pages-router entry remains present", () => {
  assert.equal(existsSync(resolve(root, "pages/2weeks/proposal/dashboard.js")), true);
});

test("all Fi JSX components in proposal dashboard have imports", () => {
  const source = read("components/TwoWeeksProposal/ProposalDashboard.js");
  const renderedIcons = [...source.matchAll(/<\s*(Fi[A-Z][\w]*)\b/g)].map(match => match[1]);
  const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']react-icons\/fi["']/g)]
    .flatMap(match => match[1].split(",").map(name => name.trim().split(/\s+as\s+/).pop()));
  for (const icon of renderedIcons) assert.ok(imports.includes(icon), `${icon} must be imported`);
  assert.ok(renderedIcons.includes("FiCheck"));
  assert.ok(renderedIcons.includes("FiChevronRight"));
});

test("profile edit JSX uses valid quoted prop and template style expression", () => {
  const source = read("components/TwoWeeksProposal/MyProfileEditModal.js");
  assert.match(source, /sub="직업을 확인할 수 있는 자료/);
  assert.doesNotMatch(source, /sub=`/);
  assert.match(source, /style=\{\{ width: `\$\{Math\.max\(/);
});

test("hosting keeps automatic build and has an explicit dashboard export rewrite", () => {
  const firebase = JSON.parse(read("firebase.json"));
  const config = read("next.config.js");
  assert.deepEqual(firebase.hosting.predeploy, ["npm run build"]);
  assert.equal(firebase.hosting.public, "out");
  assert.match(config, /output:\s*["']export["']/);
  assert.ok(firebase.hosting.rewrites.some(item => item.source === "/2weeks/proposal/dashboard" && item.destination === "/2weeks/proposal/dashboard.html"));
});

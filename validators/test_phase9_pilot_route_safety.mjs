import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validatePublicManifestRoot } from "./public_safety.mjs";

const phase9RiskyBooleanKeys = [
  "pilot_route_execution_allowed",
  "route_execution_allowed",
  "public_route_execution_allowed",
  "website_build_allowed",
  "website_source_allowed",
  "public_deployment_allowed",
  "tracking_activation_allowed",
  "mcp_execution_allowed",
  "drive_upload_allowed",
  "stage_3_asset_creation_allowed",
  "external_publication_allowed",
  "route_5_triggered",
  "service_readiness_claimed"
];

function writeManifest(root, name, body) {
  const dir = path.join(root, "manifests", "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

function createBaseManifest(extra = {}) {
  return {
    manifest_id: "PHASE9_PILOT_ROUTE_TEST_MANIFEST_PLACEHOLDER",
    record_status: "prepared_only_example",
    prepared_only: true,
    synthetic: true,
    planning_only: true,
    ...extra
  };
}

for (const key of phase9RiskyBooleanKeys) {
  const root = mkdtempSync(path.join(tmpdir(), "phase9-pilot-risk-"));
  try {
    writeManifest(root, "unsafe.json", createBaseManifest({ [key]: true }));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected ${key}=true to fail Phase 9 pilot route safety validation.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase9-pilot-positive-"));
try {
  writeManifest(positiveRoot, "safe.json", createBaseManifest(Object.fromEntries(phase9RiskyBooleanKeys.map((key) => [key, false]))));
  const result = validatePublicManifestRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected all risky Phase 9 booleans set to false to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

console.log("Phase 9 pilot route safety tests passed.");

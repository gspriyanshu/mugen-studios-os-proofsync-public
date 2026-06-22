import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validatePublicManifestRoot } from "./public_safety.mjs";

const phase7RiskyBooleanKeys = [
  "drive_upload_allowed",
  "drive_upload_executed",
  "drive_download_allowed",
  "drive_download_executed",
  "real_drive_identifier",
  "raw_evidence_in_github",
  "screenshots_in_github",
  "videos_in_github",
  "renders_in_github",
  "failed_outputs_in_github",
  "website_source_allowed",
  "tracking_runtime_ids_allowed",
  "website_deployment_allowed",
  "mcp_execution_allowed",
  "stage_2_execution_allowed",
  "stage_3_asset_creation_allowed",
  "demo_asset_creation_allowed",
  "live_testing_allowed",
  "public_claims_allowed"
];

function writeManifest(root, name, body) {
  const dir = path.join(root, "manifests", "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

function createBaseManifest(extra = {}) {
  return {
    manifest_id: "PHASE7_POINTER_TEST_MANIFEST_PLACEHOLDER",
    record_status: "prepared_only_example",
    prepared_only: true,
    synthetic: true,
    pointer_only: true,
    ...extra
  };
}

for (const key of phase7RiskyBooleanKeys) {
  const root = mkdtempSync(path.join(tmpdir(), "phase7-pointer-risk-"));
  try {
    writeManifest(root, "unsafe.json", createBaseManifest({ [key]: true }));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected ${key}=true to fail Phase 7 pointer safety validation.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase7-pointer-positive-"));
try {
  writeManifest(positiveRoot, "safe.json", createBaseManifest(Object.fromEntries(phase7RiskyBooleanKeys.map((key) => [key, false]))));
  const result = validatePublicManifestRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected all risky Phase 7 booleans set to false to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

console.log("Phase 7 pointer safety tests passed.");

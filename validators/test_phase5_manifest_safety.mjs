import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validatePublicManifestRoot } from "./public_safety.mjs";

const riskyBooleanKeys = [
  "accepted_skillopt_update",
  "accepted_skillopt_learning_update",
  "accepted_autoresearch_update",
  "accepted_autoresearch_learning_update",
  "real_service_record",
  "fake_cycle",
  "real_mcp_artifact",
  "real_drive_identifier",
  "drive_download_allowed",
  "live_testing_allowed",
  "demo_asset_creation_allowed",
  "public_export_allowed",
  "service_readiness_claimed",
  "client_readiness_claimed",
  "production_use_claimed",
  "raw_evidence_included",
  "local_path_included",
  "client_data_included"
];

function writeManifest(root, name, body) {
  const dir = path.join(root, "manifests", "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

function createBaseManifest(extra = {}) {
  return {
    manifest_id: "PHASE5_TEST_MANIFEST_PLACEHOLDER",
    record_status: "prepared_only_example",
    prepared_only: true,
    synthetic: true,
    ...extra
  };
}

for (const key of riskyBooleanKeys) {
  const root = mkdtempSync(path.join(tmpdir(), "phase5-manifest-risk-"));
  try {
    writeManifest(root, "unsafe.json", createBaseManifest({ [key]: true }));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected ${key}=true to fail prepared-only manifest validation.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase5-manifest-positive-"));
try {
  writeManifest(positiveRoot, "safe.json", createBaseManifest(Object.fromEntries(riskyBooleanKeys.map((key) => [key, false]))));
  const result = validatePublicManifestRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected all risky Phase 5 booleans set to false to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

console.log("Phase 5 manifest safety tests passed.");

import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validatePublicManifestRoot } from "./public_safety.mjs";

const phase8RiskyBooleanKeys = [
  "website_build_allowed",
  "website_source_allowed",
  "public_website_allowed",
  "private_website_build_allowed",
  "website_deployment_allowed",
  "github_pages_allowed",
  "public_deployment_allowed",
  "tracking_activation_allowed",
  "tracking_runtime_ids_allowed",
  "real_runtime_ids_allowed",
  "real_platform_runtime_ids_allowed",
  "gtm_publish_allowed",
  "live_network_tracking_allowed",
  "search_console_verification_allowed",
  "route_execution_allowed",
  "form_submission_allowed",
  "ad_platform_mutation_allowed",
  "mcp_execution_allowed",
  "drive_upload_allowed",
  "drive_download_allowed",
  "drive_download_executed",
  "stage_2_execution_allowed",
  "stage_3_asset_creation_allowed",
  "public_claims_allowed",
  "service_readiness_claimed",
  "route_5_triggered"
];

function writeManifest(root, name, body) {
  const dir = path.join(root, "manifests", "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

function createBaseManifest(extra = {}) {
  return {
    manifest_id: "PHASE8_WEBSITE_GATE_TEST_MANIFEST_PLACEHOLDER",
    record_status: "prepared_only_example",
    prepared_only: true,
    synthetic: true,
    planning_only: true,
    ...extra
  };
}

for (const key of phase8RiskyBooleanKeys) {
  const root = mkdtempSync(path.join(tmpdir(), "phase8-website-gate-risk-"));
  try {
    writeManifest(root, "unsafe.json", createBaseManifest({ [key]: true }));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected ${key}=true to fail Phase 8 website gate safety validation.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase8-website-gate-positive-"));
try {
  writeManifest(positiveRoot, "safe.json", createBaseManifest(Object.fromEntries(phase8RiskyBooleanKeys.map((key) => [key, false]))));
  const result = validatePublicManifestRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected all risky Phase 8 booleans set to false to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

console.log("Phase 8 website gate safety tests passed.");

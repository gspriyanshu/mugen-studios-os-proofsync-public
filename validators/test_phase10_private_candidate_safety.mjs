import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { validatePublicManifestRoot } from "./public_safety.mjs";

const phase10RiskyBooleanKeys = [
  "public_proof_asset_allowed",
  "public_demo_asset_allowed",
  "public_release_allowed",
  "portfolio_publication_allowed",
  "marketplace_submission_allowed",
  "client_delivery_allowed",
  "stage_2_live_testing_allowed",
  "stage_3_asset_creation_allowed",
  "demo_proof_claimed",
  "route_execution_allowed",
  "public_route_execution_allowed",
  "website_build_allowed",
  "website_source_allowed",
  "public_deployment_allowed",
  "tracking_activation_allowed",
  "runtime_ids_allowed",
  "mcp_execution_allowed",
  "drive_upload_allowed",
  "drive_download_allowed",
  "route_5_triggered",
  "external_publication_allowed",
  "public_claims_allowed",
  "service_readiness_claimed",
  "client_readiness_claimed",
  "production_use_claimed",
  "raw_evidence_included",
  "raw_evidence_in_github",
  "screenshots_in_github",
  "videos_in_github",
  "renders_in_github",
  "failed_outputs_in_github",
  "ga4_allowed",
  "search_console_allowed",
  "google_ads_allowed",
  "meta_ads_allowed",
  "linkedin_ads_allowed"
];

function writeManifest(root, name, body) {
  const dir = path.join(root, "manifests", "public");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
}

function createBaseManifest(extra = {}) {
  return {
    manifest_id: "PHASE10_PRIVATE_CANDIDATE_TEST_MANIFEST_PLACEHOLDER",
    record_status: "prepared_only_example",
    prepared_only: true,
    synthetic: true,
    planning_only: true,
    ...extra
  };
}

for (const key of phase10RiskyBooleanKeys) {
  const root = mkdtempSync(path.join(tmpdir(), "phase10-candidate-risk-"));
  try {
    writeManifest(root, "unsafe.json", createBaseManifest({ [key]: true }));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected ${key}=true to fail Phase 10 private candidate safety validation.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase10-candidate-positive-"));
try {
  writeManifest(positiveRoot, "safe.json", createBaseManifest(Object.fromEntries(phase10RiskyBooleanKeys.map((key) => [key, false]))));
  const result = validatePublicManifestRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected all risky Phase 10 booleans set to false to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

console.log("Phase 10 private candidate safety tests passed.");

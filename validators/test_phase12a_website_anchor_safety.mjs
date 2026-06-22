import { existsSync, mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { scanPublicExportRoot, validatePublicManifestRoot, validateRuntimeConfigRoot } from "./public_safety.mjs";

const targetRoot = path.resolve(process.argv[2] ?? process.cwd());

const safeHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>MUGEN ProofSync Lab</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main>
    <h1>Public URL anchor for controlled platform setup</h1>
    <p>Placeholder-only shell. No tracking, forms, external scripts, MCP execution, Drive action, Stage 2 run, or Stage 3 asset creation.</p>
    <a href="#tag-status">Tag status</a>
  </main>
</body>
</html>
`;

const safeCss = `:root { color: #101418; background: #ffffff; }
body { margin: 0; font-family: Arial, sans-serif; }
a { color: #0f5bff; }
`;

const safeRuntime = {
  config_status: "PLACEHOLDER_ONLY_NO_NETWORK",
  expected_public_url: "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/",
  platform_placeholders: {
    google_tag_manager_container_id: "GTM_CONTAINER_ID_PLACEHOLDER",
    ga4_measurement_id: "GA4_MEASUREMENT_ID_PLACEHOLDER",
    google_ads_conversion_id: "ADS_CONVERSION_ID_PLACEHOLDER",
    meta_pixel_id: "META_PIXEL_ID_PLACEHOLDER",
    linkedin_partner_id: "LINKEDIN_PARTNER_ID_PLACEHOLDER",
    search_console_verification: "SEARCH_CONSOLE_VERIFICATION_PLACEHOLDER"
  },
  activation_locks: {
    tracking_activation_allowed: false,
    real_runtime_ids_allowed: false,
    mcp_execution_allowed: false,
    drive_upload_allowed: false,
    stage_2_live_testing_allowed: false,
    stage_3_asset_creation_allowed: false
  }
};

function write(root, relativePath, body) {
  const fullPath = path.join(root, relativePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, body);
}

function writeSafeSite(root) {
  write(root, "site/index.html", safeHtml);
  write(root, "site/styles.css", safeCss);
  write(root, "site/runtime-config.example.json", JSON.stringify(safeRuntime, null, 2));
  write(root, "site/robots.txt", "User-agent: *\nDisallow: /\n");
}

function expectScanFailure(relativePath, body, expected) {
  const root = mkdtempSync(path.join(tmpdir(), "phase12a-site-risk-"));
  try {
    write(root, relativePath, body);
    const result = scanPublicExportRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(expected))) {
      console.error(`Expected ${relativePath} to fail with ${expected}.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function expectManifestFailure(key) {
  const root = mkdtempSync(path.join(tmpdir(), "phase12a-manifest-risk-"));
  try {
    write(root, "manifests/public/unsafe.json", JSON.stringify({
      manifest_id: "PHASE12A_UNSAFE_PLACEHOLDER",
      record_status: "prepared_only_example",
      prepared_only: true,
      synthetic: true,
      [key]: true
    }, null, 2));
    const result = validatePublicManifestRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(`${key}=true`))) {
      console.error(`Expected manifest ${key}=true to fail.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "phase12a-site-positive-"));
try {
  writeSafeSite(positiveRoot);
  const scan = scanPublicExportRoot(positiveRoot);
  if (!scan.ok) {
    console.error("Expected safe Phase 12A site shell to pass public export scan.");
    console.error(scan.issues.join("\n"));
    process.exit(1);
  }
  const runtime = validateRuntimeConfigRoot(positiveRoot);
  if (!runtime.ok) {
    console.error("Expected safe Phase 12A runtime config to pass.");
    console.error(runtime.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

expectScanFailure("site/index.html", safeHtml.replace("</body>", "<script src=\"https://example.com/tag.js\"></script></body>"), "script element");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<a onclick=\"void(0)\" href=\"#\">click</a></body>"), "inline event handler");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<a href=\"javascript:void(0)\">click</a></body>"), "javascript URL");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<iframe src=\"about:blank\"></iframe></body>"), "iframe element");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<form action=\"/lead\"><input type=\"submit\"></form></body>"), "form element");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<button type=\"submit\">Send</button></body>"), "submit control");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<link rel=\"stylesheet\" href=\"https://example.com/site.css\"></body>"), "external stylesheet");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<img src=\"https://example.com/pixel.png\" alt=\"\"></body>"), "remote image");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"g" + "tag"}('config','${"G-" + "PLACEHOLDER"}')</p></body>`), "gtag loader");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"https://www.google" + "tagmanager.com/gtm/js"}</p></body>`), "Google tag script");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"GTM-" + "ABCDE1"}</p></body>`), "GTM container ID");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"G-" + "ABCDEF1"}</p></body>`), "GA4 measurement ID");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"AW-" + "1234567"}</p></body>`), "Google Ads conversion ID");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"f" + "bq"}('track','PageView')</p></body>`), "Meta Pixel loader");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"google" + "-site-verification"}=abc123</p></body>`), "Search Console token");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"document" + ".cookie"}='x'</p></body>`), "cookie access");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"local" + "Storage"}.setItem('x','y')</p></body>`), "browser storage access");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"fetch"}('/collect')</p></body>`), "network request");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>${"navigator.send" + "Beacon"}('/collect')</p></body>`), "network request");
expectScanFailure("site/index.html", safeHtml.replace("</body>", `<p>new ${"XMLHttp" + "Request"}()</p></body>`), "network request");
expectScanFailure("site/index.html", safeHtml.replace("</body>", "<p>endpoint_url: /collect</p></body>"), "webhook or API endpoint");
expectScanFailure("site/styles.css", `${safeCss}\n@import url('https://example.com/fonts.css');`, "css remote import");
expectScanFailure("site/source/app.js", "console.log('blocked');", "not in public-safe allowlist");
expectScanFailure(".github/workflows/other.yml", "name: other\n", "not in public-safe allowlist");
expectScanFailure(".github/workflows/deploy-pages.yml", "name: bad\non: push\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - run: curl https://example.com\n", "workflow shell command");

for (const key of [
  "github_pages_allowed",
  "website_deployment_allowed",
  "public_deployment_allowed",
  "tracking_activation_allowed",
  "runtime_ids_allowed",
  "mcp_execution_allowed",
  "drive_upload_allowed",
  "stage_2_live_testing_allowed",
  "stage_3_asset_creation_allowed",
  "ad_spend_allowed"
]) {
  expectManifestFailure(key);
}

const manifestPath = path.join(targetRoot, "manifests/public/public_url_anchor.prepared.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const decision = manifest.skillopt_autoresearch_decision ?? {};
  const cache = manifest.token_time_cache ?? {};
  if (decision.ledger_update_status !== "none_deferred_no_accepted_update") {
    console.error("Expected Phase 12A public manifest to record deferred ledger status.");
    process.exit(1);
  }
  if (decision.public_learning_update_allowed !== false) {
    console.error("Expected Phase 12A public manifest to block public learning updates.");
    process.exit(1);
  }
  if (manifest.mcp_connection_readiness_status !== "registry_only_no_execution") {
    console.error("Expected Phase 12A public manifest to record MCP readiness as registry-only.");
    process.exit(1);
  }
  if (cache.cache_key !== "phase_12a_public_url_anchor_mcp_readiness_v1_changed_files_only") {
    console.error("Expected Phase 12A public manifest cache key to match private cache key.");
    process.exit(1);
  }
}

console.log("Phase 12A website anchor safety tests passed.");

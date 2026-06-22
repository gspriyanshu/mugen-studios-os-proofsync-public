import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE_4B_ALLOWED_PATHS = new Set([
  "README.md",
  "CHANGELOG.md",
  ".gitignore",
  "package.json",
  "runtime-config.example.json",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/CODEOWNERS",
  ".github/workflows/validate.yml",
  "docs/integration_sync_v2_12/README.md",
  "schemas/README.md",
  "validators/README.md",
  "validators/public_safety.mjs",
  "validators/scan_public_export.mjs",
  "validators/validate_runtime_config.mjs",
  "validators/validate_public_manifests.mjs",
  "validators/validate_public_schemas.mjs",
  "validators/test_phase5_manifest_safety.mjs",
  "validators/test_phase7_pointer_safety.mjs",
  "validators/test_phase8_website_gate_safety.mjs",
  "validators/test_phase9_pilot_route_safety.mjs",
  "validators/test_phase10_private_candidate_safety.mjs",
  "validators/test_phase11_release_gate_safety.mjs",
  "validators/test_phase12a_website_anchor_safety.mjs",
  "manifests/README.md",
  "site/README.md",
  "site/index.html",
  "site/styles.css",
  "site/runtime-config.example.json",
  "site/robots.txt",
  "site/googledbdd16d600ee4f62.html",
  ".github/workflows/deploy-pages.yml"
]);

const PUBLIC_SAFE_PATH_PATTERNS = [
  /^schemas\/[a-z0-9_.-]+\.schema\.json$/i,
  /^manifests\/(?:examples|public)\/[a-z0-9_.-]+\.json$/i,
  /^docs\/public-safe\/[a-z0-9_.-]+\.md$/i,
  /^budgets\/[a-z0-9_.-]+\.md$/i,
  /^proof-index\/README\.md$/i
];

const TEXT_EXTENSIONS = new Set([".md", ".json", ".mjs", ".yml", ".yaml", ".html", ".css", ".txt", ".gitignore"]);
const TEXT_PATHS = new Set([".github/CODEOWNERS"]);
const BLOCKED_PATH_EXCEPTIONS = new Set([".github/workflows/validate.yml", ".github/workflows/deploy-pages.yml"]);
const GSC_VERIFICATION_FILE_PATH = "site/googledbdd16d600ee4f62.html";
const GSC_VERIFICATION_FILE_CONTENT = `${"google" + "-site-verification"}: googledbdd16d600ee4f62.html`;
const APPROVED_GTM_SITE_PATH = "site/index.html";
const APPROVED_GTM_CONTAINER_ID = `${"GTM-" + "PQQGGB38"}`;
const APPROVED_GTM_HOST = `${"www.google" + "tagmanager.com"}`;
const APPROVED_GTM_HEAD_SNIPPET = `    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://${APPROVED_GTM_HOST}/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${APPROVED_GTM_CONTAINER_ID}');</script>
    <!-- End Google Tag Manager -->`;
const APPROVED_GTM_NOSCRIPT_SNIPPET = `    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://${APPROVED_GTM_HOST}/ns.html?id=${APPROVED_GTM_CONTAINER_ID}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->`;
const BLOCKED_EXTENSIONS = new Set([
  ".mp4", ".mov", ".mkv", ".avi", ".webm", ".wav", ".mp3", ".aiff",
  ".psd", ".ai", ".fig", ".sketch", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".heic", ".tiff", ".tif", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
  ".pdf", ".csv", ".tsv", ".xlsx", ".xls", ".ods", ".docx", ".pptx", ".htm",
  ".parquet", ".sqlite", ".sqlite3", ".db", ".env"
]);

const BLOCKED_PATH_PARTS = [
  "raw-evidence",
  "raw_evidence",
  "private-evidence",
  "private_evidence",
  "failed-renders",
  "failed_renders",
  "frame-renders",
  "frame_renders",
  "screenshots",
  "videos",
  "exports",
  "site/source",
  "site/src",
  ".github/workflows"
];

const rx = (parts, flags = "i") => new RegExp(parts.join(""), flags);

const CONTENT_PATTERNS = [
  { name: "local private path", pattern: /\/Users\/[^\s)"']+/ },
  { name: "home directory path", pattern: /(?:~\/|\/home\/[^\s)"']+|[A-Za-z]:\\Users\\[^\s)"']+)/ },
  { name: "temporary or mounted local path", pattern: /(?:file:\/\/\/[^\s)"']+|\/tmp\/[^\s)"']+|\/Volumes\/[^\s)"']+)/ },
  { name: "Google Drive or Docs URL", pattern: /https?:\/\/(?:drive|docs)\.google\.com\/[^\s)"']+/i },
  { name: "assigned Drive identifier", pattern: rx(["\\b(?:drive|folder|file)_id[\"']?\\s*[:=]\\s*[\"']?[A-Za-z0-9_-]{20,}"]) },
  { name: "MCP connector route", pattern: rx(["\\b(?:", "mcp", "__|", "mcp", ":\\/\\/|", "app", ":\\/\\/)[A-Za-z0-9_.:/-]+"]) },
  { name: "MCP private field", pattern: rx(["\\bmcp", "_(?:route|log|output|tool|trace|call|result|path)\\b"]) },
  { name: "Meta ad account id", pattern: /\bact_\d{5,}\b/i },
  { name: "Google Ads customer id", pattern: /\b\d{3}-\d{3}-\d{4}\b/ },
  { name: "GTM container ID", pattern: /\bGTM-[A-Z0-9]{4,}\b/ },
  { name: "GA4 measurement ID", pattern: /\bG-[A-Z0-9]{6,}\b/ },
  { name: "Google Ads conversion ID", pattern: /\bAW-\d{6,}\b/ },
  { name: "Universal Analytics ID", pattern: /\bUA-\d{4,}-\d+\b/ },
  { name: "assigned runtime numeric identifier", pattern: rx(["\\b(?:meta_pixel(?:_id|\\.id)?|pixel_id|linkedin(?:_partner_id|\\.partner_id|\\.id)?|tracking_runtime_ids?|runtime_ids?|gtm_container_id|ga4_measurement_id|ads_conversion_id|search_console_verification)[\"']?\\s*[:=]\\s*(?:\\[\\s*)?[\"']?\\d{6,}"]) },
  { name: "gtag loader", pattern: /\bgtag\s*\(/ },
  { name: "Meta Pixel loader", pattern: /\bfbq\s*\(/ },
  { name: "Google tag script", pattern: /googletagmanager\.com\/(?:gtm\.js|gtm\/js|gtag\/js)/i },
  { name: "Meta pixel script", pattern: /connect\.facebook\.net\/[^"'\s]*fbevents\.js/i },
  { name: "LinkedIn insight loader", pattern: rx(["\\b(?:_linkedin", "_partner_id|lintrk\\s*\\()"]) },
  { name: "Search Console token", pattern: rx(["google", "-site-verification"]) },
  { name: "private key block", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { name: "assigned secret-like value", pattern: /\b(?:api[_-]?key|secret|token|password|oauth[_-]?token|cookie|session)\b\s*[:=]\s*["']?[A-Za-z0-9_\-/.+=]{12,}/i }
];

const PHASE_12A_SITE_PATHS = new Set([
  "site/index.html",
  "site/styles.css",
  "site/runtime-config.example.json",
  "site/robots.txt"
]);

const PHASE_12A_SITE_CONTENT_PATTERNS = [
  { name: "script element", pattern: /<script\b/i },
  { name: "inline event handler", pattern: /\son[a-z]+\s*=/i },
  { name: "javascript URL", pattern: /\b(?:href|src)\s*=\s*["']javascript:/i },
  { name: "external stylesheet or preconnect", pattern: /<link\b[^>]*\bhref\s*=\s*["']https?:\/\//i },
  { name: "css remote import", pattern: /@import\s+url\s*\(\s*["']?https?:\/\//i },
  { name: "iframe element", pattern: /<iframe\b/i },
  { name: "form element", pattern: /<form\b/i },
  { name: "submit control", pattern: /\btype\s*=\s*["']submit["']/i },
  { name: "cookie access", pattern: /\bdocument\.cookie\b/i },
  { name: "browser storage access", pattern: /\b(?:localStorage|sessionStorage)\b/i },
  { name: "network request", pattern: /\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(/i },
  { name: "remote image", pattern: /<img\b[^>]*\bsrc\s*=\s*["']https?:\/\//i },
  { name: "webhook or API endpoint", pattern: /\b(?:webhook|api_endpoint|endpoint_url)\b\s*[:=]/i }
];

const PHASE_12A_WORKFLOW_CONTENT_PATTERNS = [
  { name: "workflow secrets reference", pattern: /\bsecrets\./i },
  { name: "workflow shell command", pattern: /^\s*-?\s*run\s*:/mi },
  { name: "workflow remote download command", pattern: /\b(?:curl|wget)\b/i },
  { name: "workflow package install command", pattern: /\b(?:npm|pnpm|yarn|bun)\s+(?:install|add|ci|run)\b/i },
  { name: "external deploy provider", pattern: /\b(?:netlify|vercel|cloudflare|firebase|surge)\b/i }
];

const PHASE_12A_WORKFLOW_REQUIRED_PHRASES = [
  "contents: read",
  "pages: write",
  "id-token: write",
  "uses: actions/checkout@v4",
  "uses: actions/configure-pages@v5",
  "uses: actions/upload-pages-artifact@v3",
  "path: site",
  "uses: actions/deploy-pages@v4"
];

const UNSAFE_CLAIM_PATTERNS = [
  { name: "client readiness", pattern: rx(["\\bclient[-_ ]", "ready\\b"], "gi") },
  { name: "proof readiness", pattern: rx(["\\bproof[-_ ]", "ready\\b"], "gi") },
  { name: "public evidence claim", pattern: rx(["\\bpublic ", "proof\\b"], "gi") },
  { name: "route 5 approval", pattern: rx(["\\broute 5 ", "approved\\b"], "gi") },
  { name: "Stage 2 execution", pattern: rx(["\\bstage 2 ", "executed\\b"], "gi") },
  { name: "Stage 3 creation", pattern: rx(["\\bstage 3 ", "proof created\\b"], "gi") },
  { name: "MCP execution", pattern: rx(["\\bmcp execution ", "executed\\b"], "gi") },
  { name: "Drive upload", pattern: rx(["\\bdrive upload ", "executed\\b"], "gi") },
  { name: "Pages activation", pattern: rx(["\\bgithub pages ", "enabled\\b"], "gi") },
  { name: "public deployment", pattern: rx(["\\bdeployed ", "publicly\\b"], "gi") },
  { name: "completed deployment", pattern: rx(["\\b(?:public )?deployment\\s+(?:is\\s+)?(?:complete|live|ready|enabled)\\b"], "gi") },
  { name: "completed website deployment", pattern: rx(["\\b(?:website\\s+)?deployment\\s+(?:has\\s+)?completed\\b"], "gi") },
  { name: "production deployment", pattern: rx(["\\bdeployed\\s+to\\s+production\\b"], "gi") },
  { name: "shell readiness variant", pattern: rx(["\\b(?:public\\s+)?shell\\s+(?:is\\s+|now\\s+)?live\\b"], "gi") },
  { name: "website liveness variant", pattern: rx(["\\bwebsite\\s+(?:is\\s+|now\\s+)?live\\b"], "gi") },
  { name: "route liveness variant", pattern: rx(["\\bpublic\\s+route\\s+(?:is\\s+|now\\s+)?live\\b"], "gi") },
  { name: "live shell claim", pattern: rx(["\\bshell\\s+is\\s+", "live\\b"], "gi") }
];

export function resolveTargetRoot(argv = process.argv) {
  return path.resolve(argv[2] ?? process.cwd());
}

export function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

export function walkFiles(root, current = root, files = []) {
  for (const entry of readdirSync(current)) {
    if (entry === ".git" || entry === "node_modules") continue;
    const fullPath = path.join(current, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkFiles(root, fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isTextFile(relativePath) {
  if (TEXT_PATHS.has(relativePath)) return true;
  if (relativePath === ".gitignore") return true;
  return TEXT_EXTENSIONS.has(path.extname(relativePath));
}

function addIssue(issues, relativePath, message) {
  issues.push(`${relativePath}: ${message}`);
}

function isAllowedPath(relativePath) {
  return PHASE_4B_ALLOWED_PATHS.has(relativePath) || PUBLIC_SAFE_PATH_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function isNegatedClaim(text, index) {
  const prefix = text.slice(Math.max(0, index - 40), index).toLowerCase();
  return /(?:not|no|never|without|blocked|forbidden|does not|must not|is not|are not)\s*$/.test(prefix);
}

function scanUnsafeClaims(text, relativePath, issues) {
  for (const { name, pattern } of UNSAFE_CLAIM_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (!isNegatedClaim(text, match.index ?? 0)) {
        addIssue(issues, relativePath, `unsafe affirmative claim: ${name}`);
      }
    }
  }
}

function scanPhase12ASiteContent(text, relativePath, issues) {
  if (!PHASE_12A_SITE_PATHS.has(relativePath)) return;
  for (const { name, pattern } of PHASE_12A_SITE_CONTENT_PATTERNS) {
    if (pattern.test(text)) {
      addIssue(issues, relativePath, `blocked Phase 12A site pattern: ${name}`);
    }
  }
}

function scanPhase12AWorkflowContent(text, relativePath, issues) {
  if (relativePath !== ".github/workflows/deploy-pages.yml") return;
  for (const { name, pattern } of PHASE_12A_WORKFLOW_CONTENT_PATTERNS) {
    if (pattern.test(text)) {
      addIssue(issues, relativePath, `blocked Phase 12A workflow pattern: ${name}`);
    }
  }
  for (const phrase of PHASE_12A_WORKFLOW_REQUIRED_PHRASES) {
    if (!text.includes(phrase)) {
      addIssue(issues, relativePath, `missing Phase 12A workflow phrase: ${phrase}`);
    }
  }
}

function isAllowedGscVerificationFile(relativePath) {
  return relativePath === GSC_VERIFICATION_FILE_PATH;
}

function scanAllowedGscVerificationFile(text, relativePath, issues) {
  if (!isAllowedGscVerificationFile(relativePath)) return;
  if (text !== GSC_VERIFICATION_FILE_CONTENT) {
    addIssue(issues, relativePath, "Google Search Console verification file must match the downloaded file exactly");
  }
}

function stripApprovedGtmSnippets(text, relativePath, issues) {
  if (relativePath !== APPROVED_GTM_SITE_PATH) return text;
  const hasApprovedGtmId = text.includes(APPROVED_GTM_CONTAINER_ID);
  const hasApprovedHead = text.includes(APPROVED_GTM_HEAD_SNIPPET);
  const hasApprovedNoscript = text.includes(APPROVED_GTM_NOSCRIPT_SNIPPET);

  if (hasApprovedGtmId && (!hasApprovedHead || !hasApprovedNoscript)) {
    addIssue(issues, relativePath, "approved GTM container must use the exact reviewed head and noscript snippets");
  }

  return text
    .replace(APPROVED_GTM_HEAD_SNIPPET, "APPROVED_GTM_HEAD_SNIPPET")
    .replace(APPROVED_GTM_NOSCRIPT_SNIPPET, "APPROVED_GTM_NOSCRIPT_SNIPPET");
}

export function scanPublicExportRoot(targetRoot) {
  const issues = [];
  if (!existsSync(targetRoot)) {
    return { ok: false, issues: [`target root does not exist: ${targetRoot}`], files: [] };
  }

  const files = walkFiles(targetRoot);
  for (const fullPath of files) {
    const relativePath = toPosix(path.relative(targetRoot, fullPath));
    const lowerPath = relativePath.toLowerCase();
    const extension = path.extname(relativePath).toLowerCase();

    if (!isAllowedPath(relativePath)) {
      addIssue(issues, relativePath, "not in public-safe allowlist");
    }
    if (BLOCKED_EXTENSIONS.has(extension)) {
      addIssue(issues, relativePath, `blocked file extension ${extension}`);
    }
    for (const blockedPart of BLOCKED_PATH_PARTS) {
      if (lowerPath.includes(blockedPart) && !BLOCKED_PATH_EXCEPTIONS.has(relativePath)) {
        addIssue(issues, relativePath, `blocked path fragment ${blockedPart}`);
      }
    }
    if (!isTextFile(relativePath)) {
      addIssue(issues, relativePath, "non-text file is not allowed in Phase 4B");
      continue;
    }

    const text = readFileSync(fullPath, "utf8");
    scanAllowedGscVerificationFile(text, relativePath, issues);
    const scanText = stripApprovedGtmSnippets(text, relativePath, issues);
    for (const { name, pattern } of CONTENT_PATTERNS) {
      if (isAllowedGscVerificationFile(relativePath) && name === "Search Console token") continue;
      if (pattern.test(scanText)) {
        addIssue(issues, relativePath, `blocked content pattern: ${name}`);
      }
    }
    scanUnsafeClaims(scanText, relativePath, issues);
    scanPhase12ASiteContent(scanText, relativePath, issues);
    scanPhase12AWorkflowContent(scanText, relativePath, issues);
  }

  return { ok: issues.length === 0, issues, files: files.map((file) => toPosix(path.relative(targetRoot, file))).sort() };
}

export function validateRuntimeConfigRoot(targetRoot) {
  const exportScan = scanPublicExportRoot(targetRoot);
  const issues = [...exportScan.issues];
  const files = exportScan.files.filter((file) => !file.startsWith("schemas/") && /(?:runtime|config|env|tracking|analytics|pixel|tag)/i.test(file));

  for (const relativePath of files) {
    if (!isAllowedPath(relativePath)) {
      issues.push(`${relativePath}: runtime/config file is not public-safe allowlisted`);
    }
    if (relativePath.endsWith(".json")) {
      try {
        const json = JSON.parse(readFileSync(path.join(targetRoot, relativePath), "utf8"));
        scanRuntimeJson(json, relativePath, issues);
      } catch (error) {
        issues.push(`${relativePath}: invalid runtime JSON: ${error.message}`);
      }
    }
  }

  return { ok: issues.length === 0, issues, files };
}

function isPlaceholderValue(value) {
  if (value === null || value === false || value === "") return true;
  return typeof value === "string" && /PLACEHOLDER|BLOCKED|NOT_CONFIGURED|EXAMPLE_ONLY/i.test(value);
}

function isRuntimeIdentifierPath(keyPath) {
  const pathText = keyPath.join(".");
  return /(gtm|ga4|measurement|ads|conversion|meta_pixel|meta\.pixel|pixel|linkedin|partner|search_console|verification|tracking_runtime_ids?|runtime_ids?)/i.test(pathText);
}

function isRuntimeIdentifierLeaf(keyPath) {
  const key = keyPath[keyPath.length - 1] ?? "";
  return /(gtm|ga4|measurement|ads|conversion|meta_pixel|pixel|linkedin|partner|search_console|verification|tracking_runtime_ids?|runtime_ids?|id)$/i.test(key);
}

function scanRuntimeJson(value, relativePath, issues, keyPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanRuntimeJson(item, relativePath, issues, [...keyPath, String(index)]));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      scanRuntimeJson(child, relativePath, issues, [...keyPath, key]);
    }
    return;
  }
  if ((isRuntimeIdentifierPath(keyPath) || isRuntimeIdentifierLeaf(keyPath)) && !isPlaceholderValue(value)) {
    issues.push(`${relativePath}: runtime config key ${keyPath.join(".")} must be placeholder-only`);
  }
}

function scanManifestJson(value, relativePath, issues, keyPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanManifestJson(item, relativePath, issues, [...keyPath, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") {
    if ((isRuntimeIdentifierPath(keyPath) || isRuntimeIdentifierLeaf(keyPath)) && !isPlaceholderValue(value)) {
      issues.push(`${relativePath}: manifest runtime key ${keyPath.join(".")} must be placeholder-only`);
    }
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...keyPath, key];
    const forbiddenTrueManifestBooleans = new Set([
      "accepted_skillopt_update",
      "accepted_skillopt_learning_update",
      "accepted_autoresearch_update",
      "accepted_autoresearch_learning_update",
      "real_service_record",
      "fake_cycle",
      "real_mcp_artifact",
      "real_drive_identifier",
      "drive_upload_allowed",
      "drive_download_allowed",
      "drive_download_executed",
      "website_build_allowed",
      "public_website_allowed",
      "private_website_build_allowed",
      "public_deployment_allowed",
      "tracking_activation_allowed",
      "real_runtime_ids_allowed",
      "real_platform_runtime_ids_allowed",
      "gtm_publish_allowed",
      "live_network_tracking_allowed",
      "search_console_verification_allowed",
      "search_console_allowed",
      "ga4_allowed",
      "google_ads_allowed",
      "meta_ads_allowed",
      "linkedin_ads_allowed",
      "route_execution_allowed",
      "pilot_route_execution_allowed",
      "public_route_execution_allowed",
      "form_submission_allowed",
      "ad_platform_mutation_allowed",
      "external_publication_allowed",
      "public_release_allowed",
      "portfolio_publication_allowed",
      "marketplace_submission_allowed",
      "sales_publication_allowed",
      "client_delivery_allowed",
      "client_facing_claim_allowed",
      "public_proof_asset_allowed",
      "public_demo_asset_allowed",
      "release_asset_creation_allowed",
      "demo_proof_claimed",
      "proof_claim_published",
      "case_study_claimed",
      "live_result_claimed",
      "performance_claim_allowed",
      "live_testing_allowed",
      "stage_2_live_testing_allowed",
      "demo_asset_creation_allowed",
      "public_export_allowed",
      "service_readiness_claimed",
      "client_readiness_claimed",
      "production_use_claimed",
      "raw_evidence_included",
      "raw_evidence_in_github",
      "screenshots_in_github",
      "videos_in_github",
      "renders_in_github",
      "failed_outputs_in_github",
      "website_source_allowed",
      "local_path_included",
      "client_data_included",
      "route_5_action_allowed",
      "paid_generation_allowed",
      "ad_spend_allowed"
    ]);
    if ([
      "tracking_runtime_ids_allowed",
      "runtime_ids_allowed",
      "website_deployment_allowed",
      "github_pages_allowed",
      "mcp_execution_allowed",
      "drive_upload_executed",
      "stage_2_execution_allowed",
      "stage_3_asset_creation_allowed",
      "route_5_triggered",
      "public_claims_allowed",
      "deployment_completed",
      "website_deployment_completed",
      "deployment_live",
      "website_live",
      "public_route_live",
      "deployment_complete",
      "website_deployment_complete",
      "public_route_enabled",
      "website_deployed"
    ].includes(key) && child === true) {
      issues.push(`${relativePath}: ${nextPath.join(".")}=true is forbidden in public-safe manifests`);
    }
    if (forbiddenTrueManifestBooleans.has(key) && child === true) {
      issues.push(`${relativePath}: ${nextPath.join(".")}=true is forbidden in prepared-only public manifests`);
    }
    if (/(drive|folder|file)_id|mcp_(route|log|output|tool|trace|call|result|path)|client_id|account_id/i.test(key) && !isPlaceholderValue(child)) {
      issues.push(`${relativePath}: ${nextPath.join(".")} contains forbidden private identifier field`);
    }
    if (!child || typeof child !== "object") {
      if ((isRuntimeIdentifierPath(nextPath) || isRuntimeIdentifierLeaf(nextPath)) && !isPlaceholderValue(child)) {
        issues.push(`${relativePath}: manifest runtime key ${nextPath.join(".")} must be placeholder-only`);
      }
    }
    scanManifestJson(child, relativePath, issues, nextPath);
  }
}

export function validatePublicManifestRoot(targetRoot) {
  const exportScan = scanPublicExportRoot(targetRoot);
  const issues = [...exportScan.issues];
  const manifestFiles = exportScan.files.filter((file) => file.startsWith("manifests/") && file.endsWith(".json"));

  for (const relativePath of manifestFiles) {
    const fullPath = path.join(targetRoot, relativePath);
    let json;
    try {
      json = JSON.parse(readFileSync(fullPath, "utf8"));
    } catch (error) {
      issues.push(`${relativePath}: invalid JSON: ${error.message}`);
      continue;
    }
    const serialized = JSON.stringify(json);
    scanManifestJson(json, relativePath, issues);
    if (/\b(accepted|ready|executed|deployed)\b/i.test(serialized) && !/\b(prepared_only|example|synthetic|blocked|false)\b/i.test(serialized)) {
      issues.push(`${relativePath}: manifest appears to claim execution/readiness without safe qualifier`);
    }
  }

  return { ok: issues.length === 0, issues, files: manifestFiles };
}

export function printResult(label, result, targetRoot) {
  if (!result.ok) {
    console.error(`${label} failed for ${targetRoot}`);
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log(`${label} passed for ${targetRoot}`);
  console.log(`checked_files=${result.files.length}`);
}

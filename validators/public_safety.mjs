import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const PHASE_4B_ALLOWED_PATHS = new Set([
  "README.md",
  "CHANGELOG.md",
  ".gitignore",
  "package.json",
  "runtime-config.example.json",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "docs/integration_sync_v2_12/README.md",
  "schemas/README.md",
  "validators/README.md",
  "validators/public_safety.mjs",
  "validators/scan_public_export.mjs",
  "validators/validate_runtime_config.mjs",
  "validators/validate_public_manifests.mjs",
  "manifests/README.md",
  "site/README.md"
]);

const PUBLIC_SAFE_PATH_PATTERNS = [
  /^schemas\/[a-z0-9_.-]+\.schema\.json$/i,
  /^manifests\/(?:examples|public)\/[a-z0-9_.-]+\.json$/i,
  /^docs\/public-safe\/[a-z0-9_.-]+\.md$/i,
  /^budgets\/[a-z0-9_.-]+\.md$/i,
  /^proof-index\/README\.md$/i
];

const TEXT_EXTENSIONS = new Set([".md", ".json", ".mjs", ".gitignore"]);
const BLOCKED_EXTENSIONS = new Set([
  ".mp4", ".mov", ".mkv", ".avi", ".webm", ".wav", ".mp3", ".aiff",
  ".psd", ".ai", ".fig", ".sketch", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".heic", ".tiff", ".tif", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
  ".pdf", ".csv", ".tsv", ".xlsx", ".xls", ".ods", ".docx", ".pptx", ".html", ".htm",
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
  { name: "assigned runtime numeric identifier", pattern: rx(["\\b(?:meta_pixel_id|linkedin_partner_id|tracking_runtime_ids?|gtm_container_id|ga4_measurement_id|ads_conversion_id|search_console_verification)[\"']?\\s*[:=]\\s*[\"']?\\d{6,}"]) },
  { name: "gtag loader", pattern: /\bgtag\s*\(/ },
  { name: "Meta Pixel loader", pattern: /\bfbq\s*\(/ },
  { name: "Google tag script", pattern: /googletagmanager\.com\/(?:gtm|gtag)\/js/i },
  { name: "Meta pixel script", pattern: /connect\.facebook\.net\/[^"'\s]*fbevents\.js/i },
  { name: "LinkedIn insight loader", pattern: rx(["\\b(?:_linkedin", "_partner_id|lintrk\\s*\\()"]) },
  { name: "Search Console token", pattern: rx(["google", "-site-verification"]) },
  { name: "private key block", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/ },
  { name: "assigned secret-like value", pattern: /\b(?:api[_-]?key|secret|token|password|oauth[_-]?token|cookie|session)\b\s*[:=]\s*["']?[A-Za-z0-9_\-/.+=]{12,}/i }
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
      if (lowerPath.includes(blockedPart)) {
        addIssue(issues, relativePath, `blocked path fragment ${blockedPart}`);
      }
    }
    if (!isTextFile(relativePath)) {
      addIssue(issues, relativePath, "non-text file is not allowed in Phase 4B");
      continue;
    }

    const text = readFileSync(fullPath, "utf8");
    for (const { name, pattern } of CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        addIssue(issues, relativePath, `blocked content pattern: ${name}`);
      }
    }
    scanUnsafeClaims(text, relativePath, issues);
  }

  return { ok: issues.length === 0, issues, files: files.map((file) => toPosix(path.relative(targetRoot, file))).sort() };
}

export function validateRuntimeConfigRoot(targetRoot) {
  const exportScan = scanPublicExportRoot(targetRoot);
  const issues = [...exportScan.issues];
  const files = exportScan.files.filter((file) => /(?:runtime|config|env|tracking|analytics|pixel|tag)/i.test(file));

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
    if ([
      "tracking_runtime_ids_allowed",
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
      "public_route_live"
    ].includes(key) && child === true) {
      issues.push(`${relativePath}: ${nextPath.join(".")}=true is forbidden in public-safe manifests`);
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

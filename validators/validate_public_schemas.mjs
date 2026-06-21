import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { printResult, resolveTargetRoot, scanPublicExportRoot } from "./public_safety.mjs";

const REQUIRED_SCHEMA = "https://json-schema.org/draft/2020-12/schema";
const SAFE_ID_PREFIX = "https://schemas.mugenstudios.example/public/";

const UNSAFE_SCHEMA_TERMS = [
  /\bdrive\b/i,
  /\bfolder_id\b/i,
  /\bfile_id\b/i,
  /\bid_or_path\b/i,
  /\bsource_path\b/i,
  /\blocal_source\b/i,
  /\bmcp\b/i,
  /\baccount_id\b/i,
  /\bclient_id\b/i,
  /\bclient_ready\b/i,
  /\bproof_ready\b/i,
  /\bexecuted\b/i,
  /\baccepted\b/i,
  /\bdeployed\b/i,
  /\blive\b/i,
  /\breal_runtime\b/i,
  /\/Users\//i,
  /\/tmp\//i,
  /\/Volumes\//i,
  /file:\/\//i,
  /drive\.google\.com/i,
  /docs\.google\.com/i,
  /mcp:\/\//i,
  /app:\/\//i,
  /\.local\b/i
];

const RISKY_BOOLEAN_FIELDS = [
  "external_sync_executed",
  "route_5_triggered",
  "execution_allowed",
  "public_or_client_surface",
  "mutation_or_spend_capable",
  "website_deployment_allowed",
  "stage_2_execution_allowed",
  "stage_3_asset_creation_allowed",
  "public_claims_allowed"
];

function walkSchema(value, issues, relativePath, keyPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkSchema(item, issues, relativePath, [...keyPath, String(index)]));
    return;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string") checkUnsafeText(value, issues, relativePath, keyPath.join("."));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...keyPath, key];
    checkUnsafeText(key, issues, relativePath, nextPath.join("."));
    if (RISKY_BOOLEAN_FIELDS.includes(key) || /_(?:live|deployed|complete|completed|enabled)$/i.test(key)) {
      if (!child || typeof child !== "object" || child.const !== false) {
        issues.push(`${relativePath}: risky boolean schema field ${nextPath.join(".")} must use const false`);
      }
    }
    walkSchema(child, issues, relativePath, nextPath);
  }
}

function checkUnsafeText(text, issues, relativePath, keyPath) {
  for (const pattern of UNSAFE_SCHEMA_TERMS) {
    if (pattern.test(text)) {
      issues.push(`${relativePath}: unsafe schema term at ${keyPath}: ${text}`);
    }
  }
}

function listSchemaFiles(targetRoot) {
  const schemaDir = path.join(targetRoot, "schemas");
  try {
    return readdirSync(schemaDir)
      .filter((entry) => entry.endsWith(".schema.json"))
      .sort()
      .map((entry) => `schemas/${entry}`);
  } catch {
    return [];
  }
}

export function validatePublicSchemasRoot(targetRoot) {
  const exportScan = scanPublicExportRoot(targetRoot);
  const issues = [...exportScan.issues];
  const files = listSchemaFiles(targetRoot);

  for (const relativePath of files) {
    if (!/^[a-z0-9_.-]+\.schema\.json$/i.test(path.basename(relativePath))) {
      issues.push(`${relativePath}: schema filename must use public-safe .schema.json naming`);
    }

    let schema;
    try {
      schema = JSON.parse(readFileSync(path.join(targetRoot, relativePath), "utf8"));
    } catch (error) {
      issues.push(`${relativePath}: invalid JSON: ${error.message}`);
      continue;
    }

    if (schema.$schema !== REQUIRED_SCHEMA) {
      issues.push(`${relativePath}: $schema must be ${REQUIRED_SCHEMA}`);
    }
    if (typeof schema.$id !== "string" || !schema.$id.startsWith(SAFE_ID_PREFIX)) {
      issues.push(`${relativePath}: $id must use ${SAFE_ID_PREFIX}`);
    }
    if (!schema.title || typeof schema.title !== "string") {
      issues.push(`${relativePath}: title is required`);
    }
    if (schema.type !== "object") {
      issues.push(`${relativePath}: root type must be object`);
    }
    walkSchema(schema, issues, relativePath);
  }

  return { ok: issues.length === 0, issues, files };
}

const targetRoot = resolveTargetRoot();
printResult("validate-public-schemas", validatePublicSchemasRoot(targetRoot), targetRoot);

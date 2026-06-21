import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { printResult, resolveTargetRoot, scanPublicExportRoot } from "./public_safety.mjs";

const REQUIRED_SCHEMA = "https://json-schema.org/draft/2020-12/schema";
const SAFE_ID_PREFIX = "https://schemas.mugenstudios.example/public/";
const term = (...parts) => parts.join(" ");

const UNSAFE_SCHEMA_TERMS = [
  "drive",
  "folder id",
  "file id",
  "id or path",
  "source path",
  "local source",
  term("absolute", "path"),
  term("private", "path"),
  term("workspace", "path"),
  term("filesystem", "path"),
  term("local", "path"),
  term("local", "file", "path"),
  term("local", "filesystem"),
  term("home", "directory"),
  term("source", "file", "path"),
  term("private", "folder", "path"),
  "mcp",
  term("app", "route"),
  term("app", "connector"),
  term("connector", "route"),
  term("tool", "route"),
  term("app", "url"),
  term("connector", "url"),
  term("tool", "url"),
  "account id",
  "client id",
  term("client", "ready"),
  term("proof", "ready"),
  term("public", "proof"),
  term("public", "evidence"),
  term("proof", "evidence"),
  term("source", "authority"),
  term("service", "internal"),
  term("private", "source", "structure"),
  "executed",
  "accepted",
  "deployed",
  "live",
  "real runtime",
  "users",
  "tmp",
  "volumes",
  "drive google com",
  "docs google com",
  term("google", "docs"),
  term("gdoc", "url"),
  term("docs", "url")
];

const RISKY_BOOLEAN_FIELDS = [
  "external sync executed",
  "route 5 triggered",
  "route5 triggered",
  "execution allowed",
  "public or client surface",
  "mutation or spend capable",
  "website deployment allowed",
  "stage 2 execution allowed",
  "stage 3 asset creation allowed",
  "public claims allowed"
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
    if (isRiskyBooleanField(key)) {
      if (!child || typeof child !== "object" || child.const !== false) {
        issues.push(`${relativePath}: risky boolean schema field ${nextPath.join(".")} must use const false`);
      }
    }
    walkSchema(child, issues, relativePath, nextPath);
  }
}

function checkUnsafeText(text, issues, relativePath, keyPath) {
  const normalized = normalizeSchemaText(text);
  for (const term of UNSAFE_SCHEMA_TERMS) {
    if (normalized.includes(term)) {
      issues.push(`${relativePath}: unsafe schema term at ${keyPath}: ${text}`);
    }
  }
}

function isRiskyBooleanField(key) {
  const normalized = normalizeSchemaText(key);
  return RISKY_BOOLEAN_FIELDS.some((term) => normalized.includes(term)) || /\b(live|deployed|complete|completed|enabled)$/.test(normalized);
}

function normalizeSchemaText(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase();
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

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
  term("route", "5", "approved"),
  term("route", "5", "approval"),
  term("route", "5", "allowed"),
  term("app", "route"),
  term("app", "connector"),
  term("connector", "route"),
  term("tool", "route"),
  term("app", "url"),
  term("connector", "url"),
  term("tool", "url"),
  "account id",
  "client id",
  term("client", "data"),
  term("client", "ready"),
  term("proof", "ready"),
  term("service", "ready"),
  term("service", "readiness"),
  term("proof", "created"),
  term("asset", "created"),
  term("stage", "3", "proof", "created"),
  term("stage", "3", "asset", "created"),
  term("proof", "published"),
  term("asset", "published"),
  term("portfolio", "published"),
  term("public", "claim", "made"),
  term("website", "published"),
  term("website", "active"),
  term("pages", "active"),
  term("github", "pages", "active"),
  term("public", "route", "active"),
  term("production", "ready"),
  term("public", "ready"),
  term("launch", "ready"),
  term("raw", "evidence"),
  term("public", "proof"),
  term("public", "evidence"),
  term("proof", "evidence"),
  term("proof", "asset"),
  term("proof", "publication"),
  term("private", "prompt"),
  term("atomic", "skill"),
  term("composite", "internal"),
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
  "external action allowed",
  "public client action allowed",
  "public or client surface",
  "mutation or spend capable",
  "website deployment allowed",
  "stage 2 execution allowed",
  "stage 3 asset creation allowed",
  "phase 5 unlocked",
  "public claims allowed"
];

const SAFE_PRIMITIVE_TYPES = new Set(["string", "number", "integer", "boolean", "null"]);

function walkSchema(value, issues, relativePath, keyPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkSchema(item, issues, relativePath, [...keyPath, String(index)]));
    return;
  }

  if (typeof value === "boolean") {
    if (isConstrainedNodePath(keyPath)) {
      issues.push(`${relativePath}: schema node ${keyPath.join(".")} must not use boolean schemas`);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      checkUnsafeText(value, issues, relativePath, keyPath.join("."));
      checkRiskyStringValue(value, issues, relativePath, keyPath);
    }
    return;
  }

  checkBannedSchemaKeywords(value, issues, relativePath, keyPath);
  checkObjectSchemaShape(value, issues, relativePath, keyPath);
  checkArraySchemaShape(value, issues, relativePath, keyPath);
  checkConstrainedPublicSchemaNode(value, issues, relativePath, keyPath);

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...keyPath, key];
    checkUnsafeText(key, issues, relativePath, nextPath.join("."));
    if (isRiskyBooleanField(key)) {
      if (!child || typeof child !== "object" || child.const !== false) {
        issues.push(`${relativePath}: risky boolean schema field ${nextPath.join(".")} must use const false`);
      } else {
        checkRiskyBooleanAnnotations(child, issues, relativePath, nextPath);
      }
    }
    walkSchema(child, issues, relativePath, nextPath);
  }
}

function checkConstrainedPublicSchemaNode(schema, issues, relativePath, keyPath) {
  if (!isConstrainedNodePath(keyPath)) return;

  const schemaPath = keyPath.join(".") || "$";
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    issues.push(`${relativePath}: schema node ${schemaPath} must be an explicitly constrained object`);
    return;
  }
  if (Object.keys(schema).length === 0) {
    issues.push(`${relativePath}: schema node ${schemaPath} must not be empty`);
    return;
  }
  if (!isExplicitlyConstrainedSchema(schema)) {
    issues.push(`${relativePath}: schema node ${schemaPath} must use const, enum, safe primitive type, constrained array, or closed object properties`);
  }
}

function isConstrainedNodePath(keyPath) {
  return keyPath[keyPath.length - 1] === "items" || keyPath[keyPath.length - 2] === "properties";
}

function isExplicitlyConstrainedSchema(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return false;
  if (Object.hasOwn(schema, "const")) return true;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return true;

  if (SAFE_PRIMITIVE_TYPES.has(schema.type)) return true;
  if (schema.type === "array") return isConstrainedArraySchema(schema);
  if (schema.type === "object") return isConstrainedObjectSchema(schema);

  return false;
}

function isConstrainedArraySchema(schema) {
  return Boolean(
    schema &&
      typeof schema === "object" &&
      !Array.isArray(schema.items) &&
      schema.items &&
      typeof schema.items === "object" &&
      Object.keys(schema.items).length > 0 &&
      isExplicitlyConstrainedSchema(schema.items)
  );
}

function isConstrainedObjectSchema(schema) {
  return Boolean(
    schema &&
      typeof schema === "object" &&
      schema.additionalProperties === false &&
      schema.properties &&
      typeof schema.properties === "object" &&
      !Array.isArray(schema.properties) &&
      Object.keys(schema.properties).length > 0 &&
      Object.values(schema.properties).every((child) => isExplicitlyConstrainedSchema(child))
  );
}

function checkObjectSchemaShape(schema, issues, relativePath, keyPath) {
  const hasObjectType = schema.type === "object" || (Array.isArray(schema.type) && schema.type.includes("object"));
  const isObjectSchema = hasObjectType || schema.properties || schema.required || schema.dependentRequired || schema.additionalProperties !== undefined;
  if (!isObjectSchema) return;

  const schemaPath = keyPath.join(".") || "$";
  if (schema.additionalProperties !== false) {
    issues.push(`${relativePath}: object schema ${schemaPath} must set additionalProperties false`);
  }

  checkRequiredFieldList(schema.required, schema, issues, relativePath, [...keyPath, "required"]);

  if (schema.dependentRequired && typeof schema.dependentRequired === "object" && !Array.isArray(schema.dependentRequired)) {
    for (const [field, dependentFields] of Object.entries(schema.dependentRequired)) {
      checkRequiredFieldList([field], schema, issues, relativePath, [...keyPath, "dependentRequired", field, "key"]);
      checkRequiredFieldList(dependentFields, schema, issues, relativePath, [...keyPath, "dependentRequired", field]);
    }
  }
}

function checkArraySchemaShape(schema, issues, relativePath, keyPath) {
  if (schema.type !== "array") return;

  const schemaPath = keyPath.join(".") || "$";
  if (!Object.hasOwn(schema, "items")) {
    issues.push(`${relativePath}: array schema ${schemaPath} must declare items`);
    return;
  }
  if (Array.isArray(schema.items)) {
    issues.push(`${relativePath}: array schema ${schemaPath} must not use tuple items`);
  }
  if (!schema.items || typeof schema.items !== "object" || Object.keys(schema.items).length === 0) {
    issues.push(`${relativePath}: array schema ${schemaPath} must use non-empty items`);
  }
}

function checkBannedSchemaKeywords(schema, issues, relativePath, keyPath) {
  const schemaPath = keyPath.join(".") || "$";
  if (Array.isArray(schema.type)) {
    issues.push(`${relativePath}: schema ${schemaPath} must not use type arrays in public schemas`);
  }
  for (const refKey of ["$ref", "$dynamicRef", "$recursiveRef"]) {
    if (Object.hasOwn(schema, refKey)) {
      issues.push(`${relativePath}: schema ${schemaPath} must not use ${refKey} in public schemas`);
    }
  }
  for (const bannedKey of [
    "propertyNames",
    "patternProperties",
    "unevaluatedProperties",
    "prefixItems",
    "additionalItems",
    "contains",
    "anyOf",
    "oneOf",
    "allOf",
    "not",
    "if",
    "then",
    "else",
    "$defs",
    "definitions",
    "dependentSchemas"
  ]) {
    if (Object.hasOwn(schema, bannedKey)) {
      issues.push(`${relativePath}: schema ${schemaPath} must not use ${bannedKey} in public schemas`);
    }
  }
  if (Object.hasOwn(schema, "dependencies")) {
    issues.push(`${relativePath}: schema ${schemaPath} must not use legacy dependencies in public schemas`);
  }
}

function checkRequiredFieldList(fields, schema, issues, relativePath, keyPath) {
  if (!Array.isArray(fields)) return;
  for (const field of fields) {
    if (typeof field !== "string") continue;
    const fieldPath = [...keyPath, field].join(".");
    if (!schema.properties || !Object.hasOwn(schema.properties, field)) {
      issues.push(`${relativePath}: required schema field ${fieldPath} must have a matching properties entry`);
      continue;
    }
    if (isRiskyBooleanField(field) && !hasConstFalse(schema.properties[field])) {
      issues.push(`${relativePath}: risky required schema field ${fieldPath} must have matching properties.${field}.const false`);
    }
  }
}

function hasConstFalse(schema) {
  return schema && typeof schema === "object" && schema.const === false;
}

function checkRiskyBooleanAnnotations(schema, issues, relativePath, keyPath) {
  const schemaPath = keyPath.join(".");
  if (schema.default === true) {
    issues.push(`${relativePath}: risky boolean schema field ${schemaPath} must not declare default true`);
  }
  if (Array.isArray(schema.examples) && schema.examples.includes(true)) {
    issues.push(`${relativePath}: risky boolean schema field ${schemaPath} must not include true examples`);
  }
  if (Array.isArray(schema.enum) && schema.enum.includes(true)) {
    issues.push(`${relativePath}: risky boolean schema field ${schemaPath} must not include true enum values`);
  }
}

function checkUnsafeText(text, issues, relativePath, keyPath) {
  const normalized = normalizeSchemaText(text);
  for (const term of UNSAFE_SCHEMA_TERMS) {
    if (includesNormalizedTerm(normalized, term)) {
      issues.push(`${relativePath}: unsafe schema term at ${keyPath}: ${text}`);
    }
  }
}

function checkRiskyStringValue(text, issues, relativePath, keyPath) {
  if (!isSchemaValuePath(keyPath)) return;
  if (isRiskyBooleanField(text)) {
    issues.push(`${relativePath}: risky schema string value at ${keyPath.join(".")}: ${text}`);
  }
}

function isSchemaValuePath(keyPath) {
  return keyPath.some((part) => ["const", "enum", "default", "examples"].includes(part));
}

function isRiskyBooleanField(key) {
  const normalized = normalizeSchemaText(key);
  return RISKY_BOOLEAN_FIELDS.some((term) => includesNormalizedTerm(normalized, term)) || hasRiskySuffix(normalized);
}

function includesNormalizedTerm(normalizedText, normalizedTerm) {
  return normalizedText.includes(normalizedTerm) || compact(normalizedText).includes(compact(normalizedTerm));
}

function compact(text) {
  return text.replace(/\s+/g, "");
}

function hasRiskySuffix(normalizedText) {
  const suffixes = ["created", "published", "active", "live", "deployed", "complete", "completed", "enabled"];
  const compactText = compact(normalizedText);
  return suffixes.some((suffix) => new RegExp(`\\b${suffix}$`).test(normalizedText) || compactText.endsWith(suffix));
}

function normalizeSchemaText(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\bzero\b/g, "0")
    .replace(/\bone\b/g, "1")
    .replace(/\btwo\b/g, "2")
    .replace(/\bthree\b/g, "3")
    .replace(/\bfour\b/g, "4")
    .replace(/\bfive\b/g, "5");
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

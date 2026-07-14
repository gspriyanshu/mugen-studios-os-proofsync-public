import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { scanPublicExportRoot } from "./public_safety.mjs";

const root = path.resolve(process.argv[2] ?? process.cwd());
const base = "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/seo-aeo-geo-demo/dental-clinic/";
const siteRoot = "site/seo-aeo-geo-demo/dental-clinic";
const articleSlugs = [
  "dental-seo-strategy",
  "dental-keyword-research",
  "dental-website-architecture",
  "dental-service-page-seo-checklist",
  "local-seo-for-dentists",
  "google-business-profile-for-dental-clinics",
  "dental-location-pages-without-doorways",
  "dental-reviews-reputation-strategy",
  "aeo-geo-for-dental-clinics",
  "dental-content-brief-template",
  "clinical-review-workflow-for-dental-content",
  "dentist-schema-markup-boundaries",
  "measure-dental-seo-ai-search-visibility",
  "dental-seo-kpi-framework",
  "ethical-dental-backlink-strategy",
  "evaluate-dental-seo-agency"
];
const pillarSlugs = new Set(["dental-seo-strategy", "local-seo-for-dentists", "aeo-geo-for-dental-clinics", "measure-dental-seo-ai-search-visibility"]);
const coreRoutes = ["", "services/", "methodology/", "articles/", "resources/dental-visibility-scorecard/"];
const previewRoute = "clinic-preview/";
const expectedIndexable = new Set([...coreRoutes.map(route => `${base}${route}`), ...articleSlugs.map(slug => `${base}articles/${slug}/`)]);
const forbiddenSchema = new Set(["Dentist", "MedicalBusiness", "LocalBusiness", "Person", "Review", "AggregateRating", "Offer", "FAQPage"]);
const failures = [];

function fail(message) { failures.push(message); }
function read(relative) {
  const file = path.join(root, relative);
  if (!existsSync(file)) { fail(`missing required file: ${relative}`); return ""; }
  return readFileSync(file, "utf8");
}
function attr(tag, name) { return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null; }
function tagValues(text, tag, key, value, output) {
  return (text.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? []).filter(item => attr(item, key)?.toLowerCase() === value.toLowerCase()).map(item => attr(item, output));
}
function schemaNodes(value, out = []) {
  if (Array.isArray(value)) value.forEach(item => schemaNodes(item, out));
  else if (value && typeof value === "object") { out.push(value); Object.values(value).forEach(item => schemaNodes(item, out)); }
  return out;
}
function pagePath(route) { return `${siteRoot}/${route}index.html`; }
function normalizeText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/Prepared and published by the Mugen Studios OS editorial team[\s\S]*?patient-health content\./gi, " ")
    .replace(/Written for dental-practice owners[\s\S]*?outcome advice\./gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function shingles(text, size = 8) {
  const words = text.split(" ").filter(Boolean);
  const out = new Set();
  for (let index = 0; index <= words.length - size; index += 1) out.add(words.slice(index, index + size).join(" "));
  return out;
}
function jaccard(left, right) {
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / Math.max(1, left.size + right.size - intersection);
}
function policyMatches(text) {
  return [
    ["fake clinic NAP", /(?:123\s+(?:Main|Dental)|\+91[-\s]?\d{10}|\b\d{3}-\d{3}-\d{4}\b)/i],
    ["patient booking action", /\b(?:book now|call the clinic|get emergency treatment)\b/i],
    ["fabricated outcome", /\b(?:rankings improved|traffic increased|appointments increased|AI citations achieved)\b/i],
    ["forbidden contact link", /href=["'](?:tel:|mailto:)/i]
  ].filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
function validatePolicyText(text) {
  for (const label of policyMatches(text)) fail(`blocked dental policy pattern: ${label}`);
}

const publicScan = scanPublicExportRoot(root);
if (!publicScan.ok) publicScan.issues.forEach(issue => fail(`public-safety: ${issue}`));

const coreSpecs = [
  ["", "Build dental visibility people can verify.", "index,follow,max-image-preview:large"],
  ["services/", "Dental visibility, built as one accountable system.", "index,follow,max-image-preview:large"],
  ["methodology/", "A method that separates readiness from results.", "index,follow,max-image-preview:large"],
  ["articles/", "The dental visibility field library.", "index,follow,max-image-preview:large"],
  ["resources/dental-visibility-scorecard/", "Dental Visibility Readiness Scorecard", "index,follow,max-image-preview:large"],
  [previewRoute, "A calmer path through dental care.", "noindex,follow"]
];

const allHtml = [];
for (const [route, expectedH1, robots] of coreSpecs) {
  const relative = pagePath(route);
  const text = read(relative);
  allHtml.push(text);
  const canonical = `${base}${route}`;
  if ((text.match(/<h1\b/gi) ?? []).length !== 1 || !text.includes(`<h1>${expectedH1}</h1>`)) fail(`${relative}: exact single H1 missing`);
  if (tagValues(text, "meta", "name", "robots", "content")[0] !== robots) fail(`${relative}: robots mismatch`);
  if (tagValues(text, "link", "rel", "canonical", "href")[0] !== canonical) fail(`${relative}: canonical mismatch`);
  if (tagValues(text, "meta", "property", "og:url", "content")[0] !== canonical) fail(`${relative}: og:url mismatch`);
  if (!text.includes("PORTFOLIO DEMONSTRATION — NOT A DENTAL CLINIC OR PATIENT-SERVICE WEBSITE")) fail(`${relative}: visible demonstration badge missing`);
  validatePolicyText(text);
}

const articleBodies = new Map();
const articleTitles = new Set();
const directAnswers = new Set();
for (const slug of articleSlugs) {
  const relative = pagePath(`articles/${slug}/`);
  const text = read(relative);
  allHtml.push(text);
  const canonical = `${base}articles/${slug}/`;
  const h1s = [...text.matchAll(/<h1\b[^>]*>([^<]+)<\/h1>/gi)].map(match => match[1].trim());
  if (h1s.length !== 1) fail(`${relative}: expected one plain H1`);
  if (articleTitles.has(h1s[0])) fail(`${relative}: duplicate H1`); else articleTitles.add(h1s[0]);
  if (tagValues(text, "meta", "name", "robots", "content")[0] !== "index,follow,max-image-preview:large") fail(`${relative}: article robots mismatch`);
  if (tagValues(text, "link", "rel", "canonical", "href")[0] !== canonical) fail(`${relative}: article canonical mismatch`);
  if (!text.includes("<strong>Publisher:</strong> MUGEN Studios OS") || !text.includes('<time datetime="2026-07-14">14 July 2026</time>')) fail(`${relative}: visible publisher/date missing`);
  if (!text.includes("Research and drafting were agent-assisted")) fail(`${relative}: production disclosure missing`);
  if (!text.includes('class="answer-box"') || !text.includes('class="takeaways"') || !text.includes('class="framework"')) fail(`${relative}: answer, takeaway or original-framework block missing`);
  if ((text.match(/class="source-list"/g) ?? []).length !== 1 || (text.match(/https:\/\//g) ?? []).length < 8) fail(`${relative}: source or link evidence is too thin`);
  const direct = text.match(/<div\b[^>]*class="answer-box"[^>]*><strong>Direct answer<\/strong>([\s\S]*?)<\/div>/i)?.[1].replace(/<[^>]+>/g, " ").trim() ?? "";
  const directWords = direct.split(/\s+/).filter(Boolean).length;
  if (directWords < 40 || directWords > 80) fail(`${relative}: direct answer must remain concise, found ${directWords} words`);
  if (directAnswers.has(direct)) fail(`${relative}: duplicate direct answer`); else directAnswers.add(direct);
  const jsonBlocks = [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => attr(match[1], "type") === "application/ld+json");
  if (jsonBlocks.length !== 1) fail(`${relative}: expected one JSON-LD block`);
  else {
    try {
      const nodes = schemaNodes(JSON.parse(jsonBlocks[0][2]));
      const types = nodes.flatMap(node => Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter(Boolean);
      for (const type of types) if (forbiddenSchema.has(type)) fail(`${relative}: forbidden schema type ${type}`);
      if (types.filter(type => type === "Article").length !== 1 || types.filter(type => type === "BreadcrumbList").length !== 1 || types.filter(type => type === "WebPage").length !== 1) fail(`${relative}: schema graph is incomplete`);
    } catch (error) { fail(`${relative}: invalid JSON-LD: ${error.message}`); }
  }
  validatePolicyText(text);
  const body = normalizeText(text.match(/<article class="article-body">([\s\S]*)<\/article>\s*<\/div>\s*<\/main>/i)?.[1] ?? text);
  const words = body.split(" ").filter(Boolean).length;
  const minimum = pillarSlugs.has(slug) ? 750 : 650;
  if (words < minimum) fail(`${relative}: useful article body is too short (${words} < ${minimum})`);
  articleBodies.set(slug, shingles(body));
}

for (let left = 0; left < articleSlugs.length; left += 1) {
  for (let right = left + 1; right < articleSlugs.length; right += 1) {
    const score = jaccard(articleBodies.get(articleSlugs[left]), articleBodies.get(articleSlugs[right]));
    if (score >= 0.08) fail(`duplicate-content gate failed: ${articleSlugs[left]} vs ${articleSlugs[right]} = ${score.toFixed(4)}`);
  }
}

const hub = read(pagePath("articles/"));
for (const slug of articleSlugs) if (!hub.includes(`${base}articles/${slug}/`)) fail(`article hub does not link to ${slug}`);

const scorecard = read(pagePath("resources/dental-visibility-scorecard/"));
const scorecardJs = read(`${siteRoot}/scorecard.js`);
if ((scorecard.match(/<fieldset class="question">/g) ?? []).length !== 27) fail("scorecard must contain exactly 27 accessible questions");
if (!scorecard.includes("not a Google ranking score") || !scorecard.includes("No response is transmitted")) fail("scorecard privacy/ranking boundary missing");
for (const [label, pattern] of [["network", /\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(/i], ["storage", /\b(?:localStorage|sessionStorage|document\.cookie)\b/i]]) if (pattern.test(scorecardJs)) fail(`scorecard script contains blocked ${label} access`);
if (!scorecardJs.includes("window.print()")) fail("scorecard print state missing");

const css = read(`${siteRoot}/dental.css`);
for (const phrase of [":focus-visible", "prefers-reduced-motion", "@media (max-width: 680px)", "@media print"]) if (!css.includes(phrase)) fail(`dental CSS safeguard missing: ${phrase}`);

const sitemap = read("site/sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
for (const url of expectedIndexable) if (locs.filter(loc => loc === url).length !== 1) fail(`sitemap must contain dental URL once: ${url}`);
if (locs.includes(`${base}${previewRoute}`)) fail("noindex clinic preview must be excluded from sitemap");

for (const text of allHtml) {
  for (const match of text.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (!href.startsWith(base)) continue;
    const route = href.slice(base.length).split("#")[0];
    const target = pagePath(route);
    if (!existsSync(path.join(root, target))) fail(`broken dental internal link: ${href}`);
  }
}

if (!forbiddenSchema.has("Dentist")) fail("negative schema fixture did not preserve Dentist block");
if (!policyMatches('<p>Book now with the best dentist at 123 Main Street.</p>').includes("patient booking action")) fail("negative booking fixture did not fail");
if (!policyMatches('<p>Book now with the best dentist at 123 Main Street.</p>').includes("fake clinic NAP")) fail("negative NAP fixture did not fail");
if (!/\bfetch\s*\(/.test('<script>fetch("https://example.com")</script>')) fail("negative network fixture did not match");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Dental-clinic SEO/AEO/GEO safety tests passed: ${articleSlugs.length} articles, ${expectedIndexable.size} indexable routes, noindex preview excluded.`);

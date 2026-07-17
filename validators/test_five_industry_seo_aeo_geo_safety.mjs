import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { scanPublicExportRoot } from "./public_safety.mjs";

const root = path.resolve(process.argv[2] || process.cwd());
const relativeRoot = "site/seo-aeo-geo-demo/five-industry";
const diskRoot = path.join(root, relativeRoot);
const base = "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/seo-aeo-geo-demo/five-industry/";
const clients = [
  { slug: "udaipur-boutique-hotel", resource: "udaipur-stay-decision-kit", notice: "Fictional Udaipur boutique-stay website simulation" },
  { slug: "field-ops-saas", resource: "field-inventory-evaluation-worksheet", notice: "Fictional field-operations software simulation" },
  { slug: "sustainable-skincare-india", resource: "skincare-claim-evidence-matrix", notice: "Fictional Indian skincare website simulation" },
  { slug: "toronto-immigration-law", resource: "ontario-representative-verification-checklist", notice: "Fictional Toronto immigration-law website simulation" },
  { slug: "austin-residential-solar", resource: "austin-solar-decision-system", notice: "Fictional Austin solar-contractor website simulation" }
];
const forbiddenSchema = new Set(["LocalBusiness", "Hotel", "LodgingBusiness", "LegalService", "Product", "SoftwareApplication", "Person", "Review", "AggregateRating", "Offer", "Service", "Electrician", "HomeAndConstructionBusiness", "MedicalBusiness", "Dentist", "FAQPage", "QAPage"]);
const failures = [];

function fail(message) { failures.push(message); }
function read(relative) {
  const full = path.join(root, relative);
  if (!existsSync(full)) { fail("missing required file: " + relative); return ""; }
  return readFileSync(full, "utf8");
}
function walk(directory, out) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
function attribute(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*[\"']([^\"']+)[\"']", "i"));
  return match ? match[1] : null;
}
function oneAttr(html, tag, key, value, output) {
  const tags = (html.match(new RegExp("<" + tag + "\\b[^>]*>", "gi")) || []).filter(function (item) {
    const current = attribute(item, key);
    return current && current.toLowerCase() === value.toLowerCase();
  });
  return tags.length === 1 ? attribute(tags[0], output) : null;
}
function visibleText(html) {
  return html.replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|quot|apos|nbsp|rarr|mdash|ndash);/gi, " ")
    .replace(/\s+/g, " ").trim();
}
function schemaNodes(value, out) {
  out = out || [];
  if (Array.isArray(value)) value.forEach(function (item) { schemaNodes(item, out); });
  else if (value && typeof value === "object") {
    out.push(value);
    Object.values(value).forEach(function (item) { schemaNodes(item, out); });
  }
  return out;
}
function clientPolicyIssues(html) {
  const issues = [];
  const visible = visibleText(html);
  if (oneAttr(html, "meta", "name", "robots", "content") !== "noindex,follow") issues.push("client robots");
  if (/\b(?:SEO|AEO|GEO)\b|search engine optimization|backlink service|keyword strategy/i.test(visible)) issues.push("visible delivery jargon");
  if (/<(?:form|input|textarea|select)\b/i.test(html)) issues.push("data form");
  if (/href=["'](?:tel:|mailto:|sms:|geo:)/i.test(html)) issues.push("active contact URI");
  if (/\b(?:4\.[5-9]\s*\/\s*5|[1-5]\s*stars?|success rate|guaranteed approval|guaranteed savings)\b/i.test(visible)) issues.push("fabricated outcome or rating");
  if (/\b\d{3}[-\s]\d{3}[-\s]\d{4}\b/.test(visible)) issues.push("plausible fake contact");
  return issues;
}

if (!existsSync(diskRoot)) {
  console.error("five-industry site root is missing");
  process.exit(1);
}

const publicScan = scanPublicExportRoot(root);
if (!publicScan.ok) publicScan.issues.forEach(function (issue) { fail("public-safety: " + issue); });

const htmlFiles = walk(diskRoot, []).filter(function (file) { return file.endsWith("index.html"); });
if (htmlFiles.length !== 91) fail("expected 91 HTML routes, found " + htmlFiles.length);

const indexable = new Set([base]);
for (const client of clients) {
  indexable.add(base + client.slug + "/");
  indexable.add(base + client.slug + "/resources/" + client.resource + "/");
}

const titles = new Set();
const descriptions = new Set();
const canonicals = new Map();
const htmlByCanonical = new Map();
let articleCount = 0;
let answerCount = 0;
let prospectCount = 0;

for (const file of htmlFiles) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const html = readFileSync(file, "utf8");
  const title = ((html.match(/<title\b[^>]*>([^<]+)<\/title>/i) || [null, ""])[1]).trim();
  const description = oneAttr(html, "meta", "name", "description", "content") || "";
  const canonical = oneAttr(html, "link", "rel", "canonical", "href");
  const stylesheet = oneAttr(html, "link", "rel", "stylesheet", "href");
  const ogUrl = oneAttr(html, "meta", "property", "og:url", "content");
  const robots = oneAttr(html, "meta", "name", "robots", "content");
  const h1s = Array.from(html.matchAll(/<h1\b[^>]*>([^<]+)<\/h1>/gi)).map(function (match) { return match[1].replace(/&amp;/g, "&").trim(); });

  if (!title || titles.has(title)) fail(relative + ": title missing or duplicated"); else titles.add(title);
  if (!description || descriptions.has(description)) fail(relative + ": description missing or duplicated"); else descriptions.add(description);
  if (!canonical || canonicals.has(canonical)) fail(relative + ": canonical missing or duplicated"); else canonicals.set(canonical, relative);
  if (!stylesheet || !canonical || new URL(stylesheet, canonical).href !== base + "five-industry.css") fail(relative + ": stylesheet does not resolve to the shared five-industry asset");
  if (ogUrl !== canonical) fail(relative + ": og:url and canonical mismatch");
  if (h1s.length !== 1) fail(relative + ": expected exactly one H1");
  htmlByCanonical.set(canonical, html);

  const clientRoute = relative.includes("/client-site/");
  if (clientRoute) {
    if (robots !== "noindex,follow") fail(relative + ": fictional client route must be noindex,follow");
    const client = clients.find(function (item) { return relative.includes("/" + item.slug + "/"); });
    if (!client || !visibleText(html).includes(client.notice)) fail(relative + ": client simulation notice missing");
    clientPolicyIssues(html).forEach(function (issue) { fail(relative + ": " + issue); });
  } else if (robots !== "index,follow,max-image-preview:large") fail(relative + ": portfolio route must be indexable");

  const blocks = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)).filter(function (match) {
    return attribute(match[1], "type") === "application/ld+json";
  });
  if (blocks.length !== 1) {
    fail(relative + ": expected exactly one JSON-LD block");
  } else {
    try {
      const nodes = schemaNodes(JSON.parse(blocks[0][2]));
      const types = nodes.flatMap(function (node) { return Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]; }).filter(Boolean);
      for (const type of types) if (forbiddenSchema.has(type)) fail(relative + ": forbidden schema type " + type);
      const orgs = nodes.filter(function (node) { return node["@type"] === "Organization"; });
      if (orgs.length !== 1 || orgs[0].name !== "MUGEN Studios OS") fail(relative + ": only the real MUGEN Organization may be identified");
      const pages = nodes.filter(function (node) { return node["@type"] === "WebPage"; });
      if (pages.length !== 1 || pages[0].url !== canonical || pages[0].name !== h1s[0]) fail(relative + ": WebPage, H1 and canonical parity failed");
      const articleRoute = /\/client-site\/insights\/[^/]+\/index\.html$/.test(relative);
      const resourceRoute = /\/resources\/[^/]+\/index\.html$/.test(relative);
      const articles = nodes.filter(function (node) { return node["@type"] === "Article"; });
      if ((articleRoute || resourceRoute) && articles.length !== 1) fail(relative + ": one Article node is required");
      if (articles.length === 1 && (articles[0].datePublished !== "2026-07-17" || articles[0].dateModified !== "2026-07-17")) fail(relative + ": Article dates mismatch");
    } catch (error) { fail(relative + ": invalid JSON-LD: " + error.message); }
  }

  if (/\/client-site\/insights\/[^/]+\/index\.html$/.test(relative)) {
    articleCount += 1;
    const words = visibleText(html).split(/\s+/).filter(Boolean).length;
    if (words < 650) fail(relative + ": article has only " + words + " visible words");
    if (!html.includes('class="article-answer"') || !visibleText(html).includes("What this cannot decide")) fail(relative + ": answer/limitation contract missing");
    if (!visibleText(html).includes("Specialist review: not performed")) fail(relative + ": specialist-review boundary missing");
  }
  answerCount += (html.match(/class="answer-unit"/g) || []).length;
  if (/\/five-industry\/[^/]+\/index\.html$/.test(relative)) {
    const block = (html.match(/<div class="prospect-grid">([\s\S]*?)<\/div><\/section>/i) || [null, ""])[1];
    prospectCount += (block.match(/<article>/g) || []).length;
  }
}

if (articleCount !== 40) fail("expected 40 client articles, found " + articleCount);
if (answerCount !== 30) fail("expected 30 core answer units, found " + answerCount);
if (prospectCount !== 50) fail("expected 50 researched authority prospects, found " + prospectCount);

for (const client of clients) {
  const prefix = path.join(diskRoot, client.slug, "client-site");
  const routes = walk(prefix, []).filter(function (file) { return file.endsWith("index.html"); });
  const articleRoutes = routes.filter(function (file) {
    return file.includes(path.sep + "insights" + path.sep) && path.dirname(file) !== path.join(prefix, "insights");
  });
  if (routes.length !== 16) fail(client.slug + ": expected 16 client routes, found " + routes.length);
  if (articleRoutes.length !== 8) fail(client.slug + ": expected 8 articles, found " + articleRoutes.length);
  const caseHtml = htmlByCanonical.get(base + client.slug + "/") || "";
  if ((caseHtml.match(/Researched — not submitted/g) || []).length !== 10) fail(client.slug + ": ten research-only prospects missing");
  const resourceHtml = htmlByCanonical.get(base + client.slug + "/resources/" + client.resource + "/") || "";
  const tbody = (resourceHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i) || [null, ""])[1];
  if ((tbody.match(/<tr>/g) || []).length !== 8) fail(client.slug + ": eight resource rows missing");
}

const sitemap = read("site/sitemap.xml");
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map(function (match) { return match[1]; });
for (const url of indexable) if (sitemapUrls.filter(function (item) { return item === url; }).length !== 1) fail("sitemap must include once: " + url);
for (const url of sitemapUrls) if (url.startsWith(base) && !indexable.has(url)) fail("sitemap contains fictional or unapproved route: " + url);

const inbound = new Map(Array.from(canonicals.keys()).map(function (url) { return [url, 0]; }));
for (const [sourceUrl, html] of htmlByCanonical) {
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let resolved;
    try { resolved = new URL(match[1], sourceUrl); } catch { fail(canonicals.get(sourceUrl) + ": invalid href " + match[1]); continue; }
    resolved.hash = "";
    resolved.search = "";
    if (resolved.href.startsWith(base)) {
      if (!htmlByCanonical.has(resolved.href)) fail(canonicals.get(sourceUrl) + ": broken internal link " + resolved.href);
      else inbound.set(resolved.href, (inbound.get(resolved.href) || 0) + 1);
    }
  }
}
for (const [url, count] of inbound) if (url !== base && count < 1) fail("orphan route: " + url);

const hub = htmlByCanonical.get(base) || "";
for (const client of clients) {
  const caseLink = base + client.slug + "/";
  const escaped = caseLink.replaceAll(".", "\\.");
  if ((hub.match(new RegExp('href="' + escaped + '"', "g")) || []).length !== 1) fail("hub owned link missing or duplicated: " + client.slug);
}

const expectedRobots = "User-agent: *\nAllow: /\n\nSitemap: https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/sitemap.xml\n";
if (read("site/robots.txt") !== expectedRobots) fail("root robots policy does not match approved crawlable contract");

const css = read(relativeRoot + "/five-industry.css");
for (const token of [".theme-hotel", ".theme-saas", ".theme-skincare", ".theme-law", ".theme-solar", ".hotel-art", ".ops-art", ".botanical-art", ".civic-art", ".solar-art", ":focus-visible", "prefers-reduced-motion", "@media (max-width: 680px)"]) {
  if (!css.includes(token)) fail("CSS safeguard missing: " + token);
}
if (/@import\b|url\s*\(\s*["']?https?:/i.test(css)) fail("CSS must not load remote assets");

if (!read("README.md").includes("[Five-industry SEO/AEO/GEO portfolio proof](" + base + ")")) fail("README hub link missing");
const exception = read("docs/public-safe/SEO_AEO_GEO_FIVE_INDUSTRY_EXCEPTION.md");
for (const phrase of ["forty noindex source-led client articles", "thirty visible direct-answer units", "fifty researched authority prospects", "rankings, acquired editorial backlinks, generative citations", "protected feature-branch pull request"]) {
  if (!exception.includes(phrase)) fail("exception record missing phrase: " + phrase);
}

const fixtures = [
  ['<meta name="robots" content="index,follow"><main>Fictional</main>', "client robots"],
  ['<meta name="robots" content="noindex,follow"><main><form><input></form></main>', "data form"],
  ['<meta name="robots" content="noindex,follow"><main>Our SEO and GEO service</main>', "visible delivery jargon"],
  ['<meta name="robots" content="noindex,follow"><main>Call 512 555 1234</main>', "plausible fake contact"]
];
for (const fixture of fixtures) if (!clientPolicyIssues(fixture[0]).includes(fixture[1])) fail("negative fixture did not reject " + fixture[1]);
if (!forbiddenSchema.has("LegalService")) fail("forbidden-schema negative fixture failed");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Five-industry safety tests passed: 91 routes, 40 substantive articles, 30 core answers, 50 research-only prospects, 11 indexable portfolio URLs.");

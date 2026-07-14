import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { scanPublicExportRoot } from "./public_safety.mjs";

const root = path.resolve(process.argv[2] ?? process.cwd());
const base = "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/seo-aeo-geo-demo/dental-clinic/jaipur-simulation/";
const clinic = `${base}clinic-site/`;
const siteRoot = "site/seo-aeo-geo-demo/dental-clinic/jaipur-simulation";
const notice = "Fictional Jaipur dental website simulation — not an operating clinic.";
const patientSpecs = new Map([
  ["", "A clearer way to explore dental care"],
  ["care/", "Start with the conversation you need"],
  ["care/preventive-visits/", "Routine visits, explained with care"],
  ["care/restorative-consultations/", "A consultation should begin with questions"],
  ["care/orthodontic-consultations/", "Clarity before an alignment consultation"],
  ["care/smile-planning/", "Your questions belong in the plan"],
  ["first-visit/", "Know what to verify before a first visit"],
  ["patient-information/", "The practical details should come first"],
  ["about/", "Trust begins with named responsibility"],
  ["contact-preview/", "Contact information should be verified first"]
]);
const proofSpecs = new Map([
  ["", "A Jaipur dental website built for patients first."],
  ["dental-website-trust-checklist/", "The dental website trust checklist."]
]);
const allowedPatientSchema = new Set(["Organization", "WebSite", "WebPage", "CreativeWork"]);
const explicitlyForbiddenSchema = new Set(["Dentist", "MedicalBusiness", "LocalBusiness", "Person", "Review", "AggregateRating", "Service", "Offer", "FAQPage", "ReserveAction", "ScheduleAction"]);
const failures = [];

function fail(message) { failures.push(message); }
function read(relative) {
  const full = path.join(root, relative);
  if (!existsSync(full)) { fail(`missing required file: ${relative}`); return ""; }
  return readFileSync(full, "utf8");
}
function patientPath(route) { return `${siteRoot}/clinic-site/${route}index.html`; }
function proofPath(route) { return `${siteRoot}/${route}index.html`; }
function attr(tag, name) { return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null; }
function matching(text, tagName, key, value) { return (text.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? []).filter(tag => attr(tag, key)?.toLowerCase() === value.toLowerCase()); }
function oneAttribute(text, tagName, key, value, output) { const tags = matching(text, tagName, key, value); return tags.length === 1 ? attr(tags[0], output) : null; }
function schemaNodes(value, out = []) {
  if (Array.isArray(value)) value.forEach(item => schemaNodes(item, out));
  else if (value && typeof value === "object") { out.push(value); Object.values(value).forEach(item => schemaNodes(item, out)); }
  return out;
}
function visibleText(html) {
  return html
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|quot|apos|nbsp|rarr|mdash|ndash);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function metadataText(html) {
  const title = html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
  const description = oneAttribute(html, "meta", "name", "description", "content") ?? "";
  return `${title} ${description}`;
}
function policyIssues(html, patient = true) {
  const issues = [];
  const visible = visibleText(html);
  const meta = metadataText(html);
  if (patient) {
    const jargon = /\b(?:SEO|AEO|GEO)\b|search[- ]engine optimization|ranking strategy|keyword strategy|backlink service|AI visibility service|marketing agency/i;
    if (jargon.test(`${visible} ${meta}`)) issues.push("visible delivery-method or agency jargon");
    if (!visible.includes(notice)) issues.push("simulation notice missing");
    if (/<(?:form|input|textarea|select)\b/i.test(html)) issues.push("patient-data field or form");
    if (/href=["'](?:tel:|mailto:|sms:|geo:)/i.test(html)) issues.push("active contact URI");
    if (/<a\b[^>]*>\s*(?:book|call|whatsapp|directions|emergency)/i.test(html)) issues.push("active booking/contact action");
    if (/\b(?:Dr\.?\s+[A-Z][a-z]+|BDS|MDS|DDS|registration\s*(?:no\.?|number)\s*[:#]?\s*[A-Z0-9-]+)/.test(visible)) issues.push("invented practitioner or credential");
    if (/(?:\+91[-\s]?\d{10}|\b\d{3}[-\s]\d{3}[-\s]\d{4}\b|\b\d{6}\s+(?:Jaipur|Rajasthan)\b)/i.test(visible)) issues.push("plausible fake NAP");
  }
  if (/\b(?:rankings improved|traffic increased|local pack achieved|AI citations achieved|appointments increased|acquired editorial backlink)\b/i.test(visible)) issues.push("fabricated outcome");
  if (/\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(|\b(?:localStorage|sessionStorage|document\.cookie)\b/i.test(html)) issues.push("network or storage access");
  return issues;
}
function parseSchema(html, relative, patient) {
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => attr(match[1], "type")?.toLowerCase() === "application/ld+json");
  if (blocks.length !== 1) { fail(`${relative}: expected exactly one JSON-LD block`); return; }
  try {
    const nodes = schemaNodes(JSON.parse(blocks[0][2]));
    const typed = nodes.filter(node => node["@type"]);
    const types = typed.flatMap(node => Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]);
    for (const type of types) {
      if (explicitlyForbiddenSchema.has(type)) fail(`${relative}: forbidden schema type ${type}`);
      if (patient && !allowedPatientSchema.has(type)) fail(`${relative}: patient schema type is not allowlisted: ${type}`);
    }
    if (types.filter(type => type === "WebPage").length !== 1) fail(`${relative}: must contain exactly one WebPage schema node`);
    if (types.filter(type => type === "Organization").length !== 1) fail(`${relative}: must contain exactly one Organization schema node`);
    const organizations = typed.filter(node => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).includes("Organization"));
    if (organizations[0]?.name !== "MUGEN Studios OS") fail(`${relative}: MUGEN Studios OS must be the only Organization entity`);
    const h1 = html.match(/<h1\b[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
    const webPage = typed.find(node => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).includes("WebPage"));
    if (webPage?.name !== h1 || webPage?.url !== oneAttribute(html, "link", "rel", "canonical", "href")) fail(`${relative}: visible H1, canonical and WebPage schema parity failed`);
  } catch (error) { fail(`${relative}: invalid JSON-LD: ${error.message}`); }
}

const publicScan = scanPublicExportRoot(root);
if (!publicScan.ok) publicScan.issues.forEach(issue => fail(`public-safety: ${issue}`));

const titles = new Set();
const descriptions = new Set();
const allUrls = new Set([...patientSpecs.keys()].map(route => `${clinic}${route}`));
allUrls.add(base);
allUrls.add(`${base}dental-website-trust-checklist/`);

for (const [route, expectedH1] of patientSpecs) {
  const relative = patientPath(route);
  const html = read(relative);
  const canonical = `${clinic}${route}`;
  const h1s = [...html.matchAll(/<h1\b[^>]*>([^<]+)<\/h1>/gi)].map(match => match[1].trim());
  if (h1s.length !== 1 || h1s[0] !== expectedH1) fail(`${relative}: exact single H1 mismatch`);
  if (oneAttribute(html, "meta", "name", "robots", "content") !== "noindex,follow") fail(`${relative}: patient robots must be noindex,follow`);
  if (oneAttribute(html, "link", "rel", "canonical", "href") !== canonical) fail(`${relative}: self canonical mismatch`);
  if (oneAttribute(html, "meta", "property", "og:url", "content") !== canonical) fail(`${relative}: og:url mismatch`);
  const title = html.match(/<title\b[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  const description = oneAttribute(html, "meta", "name", "description", "content") ?? "";
  if (!title || titles.has(title)) fail(`${relative}: title is missing or duplicated`); else titles.add(title);
  if (!description || descriptions.has(description)) fail(`${relative}: description is missing or duplicated`); else descriptions.add(description);
  for (const issue of policyIssues(html, true)) fail(`${relative}: ${issue}`);
  parseSchema(html, relative, true);
  if ((html.match(/class="answer-unit"/g) ?? []).length !== 1 || !html.includes("<strong>Responsibility</strong>") || !html.includes("<strong>Limitation</strong>")) fail(`${relative}: complete visible answer unit missing`);
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const href = match[1].split("#")[0];
    if (href.startsWith(base) && !allUrls.has(href) && href !== "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/seo-aeo-geo-demo/dental-clinic/articles/") fail(`${relative}: internal link leaves approved Jaipur route set: ${href}`);
  }
}

for (const [route, expectedH1] of proofSpecs) {
  const relative = proofPath(route);
  const html = read(relative);
  const canonical = `${base}${route}`;
  const h1s = [...html.matchAll(/<h1\b[^>]*>([^<]+)<\/h1>/gi)].map(match => match[1].trim());
  if (h1s.length !== 1 || h1s[0] !== expectedH1) fail(`${relative}: exact single H1 mismatch`);
  if (oneAttribute(html, "meta", "name", "robots", "content") !== "index,follow,max-image-preview:large") fail(`${relative}: proof route must be indexable`);
  if (oneAttribute(html, "link", "rel", "canonical", "href") !== canonical) fail(`${relative}: proof canonical mismatch`);
  parseSchema(html, relative, false);
  for (const issue of policyIssues(html, false)) fail(`${relative}: ${issue}`);
  for (const required of ["fictional", "Jaipur", "No clinic entity", "Clinical content would require a real qualified dentist", "not acquired editorial backlinks", "Search eligibility does not prove indexation or rankings"]) if (!visibleText(html).includes(required)) fail(`${relative}: required capability/outcome disclosure missing: ${required}`);
}

const sitemap = read("site/sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(match => match[1].trim());
for (const route of patientSpecs.keys()) if (sitemapUrls.includes(`${clinic}${route}`)) fail(`sitemap must exclude patient route: ${route || "home"}`);
for (const route of proofSpecs.keys()) if (sitemapUrls.filter(url => url === `${base}${route}`).length !== 1) fail(`sitemap must include proof route exactly once: ${route || "case study"}`);

const css = read(`${siteRoot}/jaipur.css`);
for (const required of [":focus-visible", "prefers-reduced-motion", "@media (max-width: 680px)", "overflow-x: clip", ".mobile-nav"]) if (!css.includes(required)) fail(`Jaipur CSS safeguard missing: ${required}`);
if (/@import\b|url\s*\(\s*["']?https?:/i.test(css)) fail("Jaipur CSS must not load remote assets");

const readme = read("README.md");
const ownedAnchor = "Jaipur dental patient-site simulation and SEO/AEO/GEO delivery proof";
if (!readme.includes(`[${ownedAnchor}](${base})`)) fail("README owned link to the Jaipur case study is missing or inexact");

const negativeFixtures = [
  ["visible jargon", '<main><p>Our SEO and GEO strategy</p></main>', html => policyIssues(html, true).includes("visible delivery-method or agency jargon")],
  ["fake NAP", '<main><p>Call +91 9876543210</p></main>', html => policyIssues(html, true).includes("plausible fake NAP")],
  ["fake dentist", '<main><p>Dr. Arun Sharma, MDS</p></main>', html => policyIssues(html, true).includes("invented practitioner or credential")],
  ["booking action", '<main><a href="/book">Book now</a></main>', html => policyIssues(html, true).includes("active booking/contact action")],
  ["contact URI", '<main><a href="tel:+919876543210">Telephone</a></main>', html => policyIssues(html, true).includes("active contact URI")],
  ["patient form", '<main><form><input name="symptoms"></form></main>', html => policyIssues(html, true).includes("patient-data field or form")],
  ["network access", '<script>fetch("/submit")</script>', html => policyIssues(html, true).includes("network or storage access")],
  ["storage access", '<script>localStorage.setItem("x","y")</script>', html => policyIssues(html, true).includes("network or storage access")],
  ["fabricated ranking", '<main><p>Rankings improved</p></main>', html => policyIssues(html, false).includes("fabricated outcome")],
  ["forbidden Dentist schema", "Dentist", value => explicitlyForbiddenSchema.has(value)],
  ["forbidden review schema", "AggregateRating", value => explicitlyForbiddenSchema.has(value)],
  ["indexable patient fixture", "index,follow", value => value !== "noindex,follow"],
  ["patient sitemap fixture", `${clinic}care/`, value => value.startsWith(clinic)]
];
for (const [name, fixture, rejects] of negativeFixtures) if (!rejects(fixture)) fail(`negative fixture did not fail: ${name}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Jaipur dental simulation safety tests passed: ${patientSpecs.size} noindex patient routes, ${proofSpecs.size} indexable proof routes, ${negativeFixtures.length} negative fixtures.`);

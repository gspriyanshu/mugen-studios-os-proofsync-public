import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { scanPublicExportRoot } from "./public_safety.mjs";

const targetRoot = path.resolve(process.argv[2] ?? process.cwd());
const baseUrl = "https://gspriyanshu.github.io/mugen-studios-os-proofsync-public/seo-aeo-geo-demo/";
const specs = [
  ["site/seo-aeo-geo-demo/index.html", baseUrl, "SEO, AEO & GEO Capability Evidence", "./styles.css"],
  ["site/seo-aeo-geo-demo/nestra-before-after/index.html", `${baseUrl}nestra-before-after/`, "NESTRA Search Visibility Before and After", "../styles.css"],
  ["site/seo-aeo-geo-demo/technical-proof/index.html", `${baseUrl}technical-proof/`, "NESTRA Technical SEO Evidence", "../styles.css"],
  ["site/seo-aeo-geo-demo/answer-entity-proof/index.html", `${baseUrl}answer-entity-proof/`, "NESTRA Answer and Entity Evidence", "../styles.css"],
  ["site/seo-aeo-geo-demo/requirements-and-measurement/index.html", `${baseUrl}requirements-and-measurement/`, "Requirements, Evaluation and Measurement", "../styles.css"],
  ["site/seo-aeo-geo-demo/articles/index.html", `${baseUrl}articles/`, "Professional-Services Search and AI Visibility Library", "../styles.css"],
  ["site/seo-aeo-geo-demo/articles/seo-for-professional-services/index.html", `${baseUrl}articles/seo-for-professional-services/`, "SEO for Professional Services: A Decision-Led Search and AI Visibility Framework", "../../styles.css", true],
  ["site/seo-aeo-geo-demo/articles/answer-engine-optimization-for-professional-services/index.html", `${baseUrl}articles/answer-engine-optimization-for-professional-services/`, "Answer Engine Optimization for Professional Services: Build Expert Answers AI Search Can Verify", "../../styles.css", true],
  ["site/seo-aeo-geo-demo/articles/measure-ai-search-visibility/index.html", `${baseUrl}articles/measure-ai-search-visibility/`, "How to Measure AI Search Visibility Without Inventing Results", "../../styles.css", true]
];
const urls = specs.map(([, url]) => url);

const protectedHashes = new Map([
  ["site/index.html", "9ca3c19f512eeb9c22468f93b91add3c5c599f59f59606dc0561322771f81d66"],
  ["site/styles.css", "b4153f802d3e0b1a28704eab29690b12c26d31165e3c0cffe69d9bc4ddf5565e"],
  ["site/robots.txt", "65cae37a92e358c2d05f74cf008fe94690712a38c4bac3c469a5984cc1373539"],
  ["site/googledbdd16d600ee4f62.html", "05bb00ed248c22de795efde68fbce8c36a7be9b72ad59370cd11f8cd7aac9da2"],
  ["site/runtime-config.example.json", "75b54da3e6de199b4433a5e95463a235d39ef21c3b15d2751ebcfecc6dfbd006"],
  [".github/workflows/deploy-pages.yml", "2ba9ca5bdba8999171f5c81b21e17f54151f0312820f4818588a06342eebe488"]
]);

for (const [relativePath, expectedHash] of protectedHashes) {
  const fullPath = path.join(targetRoot, relativePath);
  if (!existsSync(fullPath)) {
    console.error(`Protected release invariant is missing: ${relativePath}`);
    process.exit(1);
  }
  const actualHash = createHash("sha256").update(readFileSync(fullPath)).digest("hex");
  if (actualHash !== expectedHash) {
    console.error(`Protected release invariant changed: ${relativePath}`);
    process.exit(1);
  }
}

const exceptionRecordPath = path.join(targetRoot, "docs/public-safe/SEO_AEO_GEO_INDEXABLE_DEMO_EXCEPTION.md");
if (!existsSync(exceptionRecordPath)) {
  console.error("SEO/AEO/GEO exception record is missing.");
  process.exit(1);
}
const exceptionRecord = readFileSync(exceptionRecordPath, "utf8");
for (const phrase of [
  "five new static demonstration routes",
  "index,follow,max-image-preview:large",
  "The exception does not change the repository root",
  "## Public-safe source inventory",
  "37.61 MiB of referenced raster imagery",
  "no crawlable anchor elements",
  "promotion and outcome validation pending"
]) {
  if (!exceptionRecord.includes(phrase)) {
    console.error(`SEO/AEO/GEO exception record is missing required phrase: ${phrase}`);
    process.exit(1);
  }
}

const demoCssPath = path.join(targetRoot, "site/seo-aeo-geo-demo/styles.css");
if (!existsSync(demoCssPath)) {
  console.error("SEO/AEO/GEO shared stylesheet is missing.");
  process.exit(1);
}
const demoCss = readFileSync(demoCssPath, "utf8");
for (const [label, pattern] of [
  ["panel foreground", /\.panel\s*\{[^}]*\bcolor\s*:\s*var\(--ink\)/i],
  ["table foreground", /\.table-wrap\s*\{[^}]*\bcolor\s*:\s*var\(--ink\)/i],
  ["blue card foreground", /\.blue\s+\.grid-3\s+article\s*\{[^}]*\bcolor\s*:\s*var\(--ink\)/i],
  ["dark card link foreground", /\.dark\s+\.grid-3\s+a\s*\{[^}]*\bcolor\s*:\s*var\(--mint\)/i],
  ["blue source link foreground", /\.blue\s+\.source-list\s+a\s*\{[^}]*\bcolor\s*:\s*white/i]
  ,["dark priority foreground", /\.dark\s+\.priority-list\s+li::before\s*\{[^}]*\bcolor\s*:\s*var\(--mint\)/i]
  ,["light focus foreground", /a:focus-visible,\s*summary:focus-visible\s*\{[^}]*outline\s*:\s*3px\s+solid\s+var\(--blue-dark\)/i]
  ,["dark and blue focus foreground", /\.dark\s+a:focus-visible[^}]*\.blue\s+summary:focus-visible\s*\{[^}]*outline-color\s*:\s*white/i]
  ,["article reading grid", /\.article-layout\s*\{[^}]*grid-template-columns\s*:\s*minmax\(0,\s*260px\)\s+minmax\(0,\s*760px\)/i]
  ,["answer-unit foreground", /\.answer-box\s*\{[^}]*background\s*:\s*var\(--surface\)[^}]*font-size\s*:\s*1\.18rem/i]
  ,["production-note distinction", /\.method-note\s*\{[^}]*border-left\s*:\s*4px\s+solid\s+var\(--amber\)/i]
]) {
  if (!pattern.test(demoCss)) {
    console.error(`SEO/AEO/GEO contrast safeguard is missing: ${label}`);
    process.exit(1);
  }
}

function cssToken(name) {
  const match = demoCss.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-f]{3,6})`, "i"));
  if (!match) throw new Error(`Missing CSS color token: ${name}`);
  return match[1];
}

function rgb(hex) {
  const value = hex.slice(1);
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channels = rgb(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [label, foreground, background] of [
  ["body text on surface", cssToken("ink"), cssToken("surface")],
  ["muted text on surface", cssToken("muted"), cssToken("surface")],
  ["dark-card links", cssToken("mint"), "#181b21"],
  ["blue-band links", "#ffffff", cssToken("blue")],
  ["standard links on surface", cssToken("blue-dark"), cssToken("surface")]
  ,["light focus on paper", cssToken("blue-dark"), cssToken("paper")]
  ,["dark priority labels", cssToken("mint"), cssToken("ink")]
  ,["dark focus", "#ffffff", cssToken("ink")]
  ,["blue focus", "#ffffff", cssToken("blue")]
]) {
  const ratio = contrast(foreground, background);
  if (ratio < 4.5) {
    console.error(`SEO/AEO/GEO contrast ratio failed for ${label}: ${ratio.toFixed(2)}:1`);
    process.exit(1);
  }
}

function write(root, relativePath, body) {
  const fullPath = path.join(root, relativePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, body);
}

function safePage(url, h1, stylesheet, article = false) {
  const schema = article
    ? { "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", "@id": `${url}#webpage`, url, name: h1 }, { "@type": "Article", "@id": `${url}#article`, headline: h1, datePublished: "2026-07-14", dateModified: "2026-07-14", mainEntityOfPage: { "@id": `${url}#webpage` }, author: { "@id": `${baseUrl}#organization` }, publisher: { "@id": `${baseUrl}#organization` } }, { "@type": "Organization", "@id": `${baseUrl}#organization`, name: "MUGEN Studios OS" }, { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [] }] }
    : { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: h1 };
  const articleMeta = article ? '<p><strong>Publisher:</strong> MUGEN Studios OS</p><time datetime="2026-07-14">14 July 2026</time><p>Research and drafting were agent-assisted and reviewed.</p>' : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${h1} | MUGEN</title><meta name="description" content="A safe test page with enough descriptive content."><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:url" content="${url}"><link rel="stylesheet" href="${stylesheet}"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><main><h1>${h1}</h1>${articleMeta}<p>Visible content matches the structured data and makes no outcome claim.</p>${urls.map((target) => `<a href="${target}">Evidence page</a>`).join("")}</main></body></html>`;
}

function safeSitemap(extra = "") {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc><lastmod>2026-07-14</lastmod></url>`).join("")}${extra}</urlset>`;
}

function writeComplete(root) {
  for (const [relativePath, url, h1, stylesheet, article] of specs) write(root, relativePath, safePage(url, h1, stylesheet, article));
  write(root, "site/seo-aeo-geo-demo/styles.css", ":root{color:#111;background:#fff}body{margin:0;font-family:Arial,sans-serif}a{color:#1248d8}");
  write(root, "site/sitemap.xml", safeSitemap());
  write(root, "docs/public-safe/SEO_AEO_GEO_INDEXABLE_DEMO_EXCEPTION.md", "# Indexable demonstration exception\n\nStatic exact routes only. No account actions or outcome claims.\n");
  write(root, "docs/public-safe/SEO_AEO_GEO_CONTENT_AUTHORITY_EXCEPTION.md", `# Content authority exception\n\n/seo-aeo-geo-demo/articles/\n/seo-aeo-geo-demo/articles/seo-for-professional-services/\n/seo-aeo-geo-demo/articles/answer-engine-optimization-for-professional-services/\n/seo-aeo-geo-demo/articles/measure-ai-search-visibility/\n\nBefore deployment, the README link is a pending owned external-domain link. After validation, the private ledger may classify it as a live owned external-domain link. It is never an acquired editorial backlink.\n\nNo plan was saved, no file was downloaded.\n\nContent-cluster and owned-authority capability proof completed — editorial backlink acquisition and search outcomes pending.\n`);
  write(root, "README.md", `[SEO/AEO/GEO content-and-authority proof](${baseUrl}articles/)\n\nContent-cluster and owned-authority capability proof completed — editorial backlink acquisition and search outcomes pending.\n`);
}

function expectFailure(label, mutate, expected) {
  const root = mkdtempSync(path.join(tmpdir(), "seo-aeo-geo-risk-"));
  try {
    writeComplete(root);
    mutate(root);
    const result = scanPublicExportRoot(root);
    if (result.ok || !result.issues.some((issue) => issue.includes(expected))) {
      console.error(`Expected ${label} to fail with ${expected}.`);
      console.error(result.issues.join("\n"));
      process.exit(1);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const positiveRoot = mkdtempSync(path.join(tmpdir(), "seo-aeo-geo-positive-"));
try {
  writeComplete(positiveRoot);
  const result = scanPublicExportRoot(positiveRoot);
  if (!result.ok) {
    console.error("Expected the complete nine-page fixture to pass.");
    console.error(result.issues.join("\n"));
    process.exit(1);
  }
} finally {
  rmSync(positiveRoot, { recursive: true, force: true });
}

expectFailure("missing page", (root) => rmSync(path.join(root, specs[8][0])), "required SEO/AEO/GEO demonstration file is missing");
expectFailure("unapproved sibling", (root) => write(root, "site/seo-aeo-geo-demo/extra/index.html", "<!doctype html>"), "not in public-safe allowlist");
expectFailure("malformed JSON-LD", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace('{"@context":"https://schema.org"', '{"@context":'));
}, "invalid JSON-LD");
expectFailure("executable script", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", "<script>void(0)</script></body>"));
}, "script element");
expectFailure("remote image", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", '<img src="https://example.com/pixel.png" alt=""></body>'));
}, "remote image");
expectFailure("protocol-relative remote resource", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", '<img src="//example.com/pixel.png" alt=""></body>'));
}, "protocol-relative remote resource");
expectFailure("form", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", '<form action="/lead"></form></body>'));
}, "form element");
expectFailure("private path", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", `<p>/${"Us" + "ers"}/example/private</p></body>`));
}, "local private path");
expectFailure("tracking code", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", `<p>${"g" + "tag"}('config','${"G-" + "ABCDEF1"}')</p></body>`));
}, "gtag loader");
expectFailure("ranking and traffic claim", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", "<p>Rankings improved and organic traffic increased.</p></body>"));
}, "blocked SEO/AEO/GEO affirmative claim or account action: ranking improvement");
expectFailure("Search Console mutations", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", "<p>We submitted the sitemap and requested indexing in Search Console.</p></body>"));
}, "blocked SEO/AEO/GEO affirmative claim or account action: sitemap submission");
expectFailure("saved Google Ads plan", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</body>", "<p>We saved the keywords to a Google Ads plan.</p></body>"));
}, "blocked SEO/AEO/GEO affirmative claim or account action: saved Google Ads plan");
expectFailure("wrong robots", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("index,follow,max-image-preview:large", "noindex,nofollow"));
}, "robots meta must equal");
expectFailure("wrong canonical", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace(`rel="canonical" href="${baseUrl}"`, 'rel="canonical" href="https://example.com/"'));
}, "canonical link must equal");
expectFailure("wrong og:url", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace(`property="og:url" content="${baseUrl}"`, 'property="og:url" content="https://example.com/"'));
}, "og:url meta must equal");
expectFailure("forbidden schema type", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace('"@type":"WebPage"', '"@type":"Product"'));
}, "forbidden schema type Product");
expectFailure("off-origin schema identifier", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace(`${baseUrl}#webpage`, "https://example.com/#webpage"));
}, "schema @id must use the approved same-origin base");
expectFailure("root-relative internal link", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</main>", '<a href="/seo-aeo-geo-demo/">Broken</a></main>'));
}, "root-relative internal link");
expectFailure("broken project link", (root) => {
  const file = path.join(root, specs[0][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace("</main>", `<a href="${baseUrl}missing/">Broken</a></main>`));
}, "internal link leaves the exact approved route set");
expectFailure("missing sitemap URL", (root) => write(root, "site/sitemap.xml", safeSitemap().replace(`<url><loc>${urls[8]}</loc><lastmod>2026-07-14</lastmod></url>`, "")), "exactly once, found 0");
expectFailure("duplicate sitemap URL", (root) => write(root, "site/sitemap.xml", safeSitemap(`<url><loc>${urls[0]}</loc><lastmod>2026-07-14</lastmod></url>`)), "exactly once, found 2");
expectFailure("extra sitemap URL", (root) => write(root, "site/sitemap.xml", safeSitemap("<url><loc>https://example.com/extra/</loc></url>")), "extra or invalid URL");
expectFailure("invalid sitemap lastmod", (root) => write(root, "site/sitemap.xml", safeSitemap().replace("2026-07-14", "2026-99-99")), "invalid sitemap lastmod");
expectFailure("malformed sitemap XML", (root) => write(root, "site/sitemap.xml", safeSitemap().replace("</urlset>", "")), "valid sitemap urlset wrapper");
expectFailure("external CSS import", (root) => write(root, "site/seo-aeo-geo-demo/styles.css", "@import url('https://example.com/site.css');"), "CSS import");
expectFailure("article without Article schema", (root) => {
  const file = path.join(root, specs[6][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace('"@type":"Article"', '"@type":"Thing"'));
}, "article page must contain exactly one Article node");
expectFailure("article byline mismatch", (root) => {
  const file = path.join(root, specs[6][0]);
  writeFileSync(file, readFileSync(file, "utf8").replace('<strong>Publisher:</strong> MUGEN Studios OS', '<strong>Publisher:</strong> Fictional Person'));
}, "visible publisher");
expectFailure("owned-link boundary removed", (root) => {
  write(root, "docs/public-safe/SEO_AEO_GEO_CONTENT_AUTHORITY_EXCEPTION.md", "# Content authority exception\n\nNo distinction.\n");
}, "pending-to-live owned-link lifecycle");

console.log("SEO/AEO/GEO live pilot safety tests passed.");

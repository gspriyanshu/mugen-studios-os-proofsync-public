# SEO/AEO/GEO indexable demonstration exception

Decision date: 2026-07-14

This record authorizes one narrow exception to the repository's prepared-only website gate: five new static demonstration routes under `site/seo-aeo-geo-demo/` and their exact entries in `site/sitemap.xml` may use `index,follow,max-image-preview:large`.

The exception does not change the repository root, root robots directive, project-level `robots.txt`, existing tag-manager loader, Search Console verification file, runtime configuration, deployment workflow, branch protection, or any external account setting.

## Exact route set

- `seo-aeo-geo-demo/`
- `seo-aeo-geo-demo/nestra-before-after/`
- `seo-aeo-geo-demo/technical-proof/`
- `seo-aeo-geo-demo/answer-entity-proof/`
- `seo-aeo-geo-demo/requirements-and-measurement/`

## Content and execution limits

- Static HTML and CSS only, plus non-executable `application/ld+json` that matches visible content.
- No forms, private identifiers, account captures, screenshots, video, remote images, remote styles, new tracking, storage, network calls, or paid-platform mutations.
- No copied job descriptions. Only public source titles, links, capture dates, split labels, and short paraphrases are permitted.
- No assertion of indexation, rankings, traffic, leads, revenue, backlinks, rich results, generative citations, endorsements, client relationships, or promotion.
- The internal 70/82/89/93 values are artifact-readiness evaluations only.
- Search Console indexing requests and sitemap submission remain outside this exception.

## Public-safe source inventory

The NESTRA portfolio case-study HTML and its referenced asset folder were inspected on 2026-07-14. The inventory method counted visible heading and anchor elements in the HTML, checked each image element for non-empty alternative text, and summed the byte size of referenced local raster assets. Retained observations: one H1, 19 H2 elements, 24 H3 elements, 23 images, 23 non-empty alternative-text values, 37.61 MiB of referenced raster imagery, no meta description, no canonical link, no JSON-LD, and no crawlable anchor elements. The private source files were not copied into this repository.

## Required release gates

The exact-path validator and dedicated safety tests must pass. The protected root files must remain byte-identical. A pull request, required validation check, normal merge, Pages deployment, live HTTP review, canonical/robots/schema/link checks, and privacy/storage review are required. If a critical regression appears after merge, rollback uses a normal revert pull request.

Status wording for the demonstration: **Three-cycle SEO/AEO/GEO capability pilot completed — promotion and outcome validation pending.**

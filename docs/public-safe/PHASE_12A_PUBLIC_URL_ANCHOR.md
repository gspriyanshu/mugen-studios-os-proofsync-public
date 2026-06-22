# Phase 12A Public URL Anchor

Phase 12A opens a narrow static URL anchor for future platform setup. The private MUGEN system remains the source authority.

Current scope:

```text
phase_id=phase_12a
scope=static_public_url_anchor_only
private_mugen_source_authority=true
public_repo_source_authority=false
real_runtime_ids_allowed=false
tracking_activation_allowed=false
mcp_execution_allowed=false
drive_upload_allowed=false
stage_2_live_testing_allowed=false
stage_3_asset_creation_allowed=false
public_claims_allowed=false
```

Allowed files are limited to the static shell, placeholder runtime config, conservative robots file, validator updates, public-safe records, and a GitHub Pages workflow with least-privilege permissions.

Blocked:

- real GTM, GA4, Google Ads, Meta, LinkedIn, Microsoft, TikTok, or Search Console identifiers
- tag loaders, pixels, forms, cookies, iframes, external scripts, external stylesheets, or network beacons
- MCP routes, logs, outputs, connector artifacts, Drive identifiers, raw evidence, client data, and private MUGEN source
- Stage 2 live testing, Stage 3 asset creation, service-readiness claims, proof claims, client delivery, ad spend, or ad platform mutation

AutoResearch and SkillOpt remain deferred. No accepted learning update exists.

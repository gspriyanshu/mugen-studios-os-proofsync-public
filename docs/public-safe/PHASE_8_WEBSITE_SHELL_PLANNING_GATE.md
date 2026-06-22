# Phase 8 Website Shell Planning Gate

Phase 8 is planning-only. It defines when a private website shell may be considered for a service route, but it does not add website source, publish a route, activate tracking, run connectors, upload evidence, or create demo assets.

## Use Rule

Use the website only when a requirement needs at least one of these:

- route, page, form, or technical configuration testing
- analytics, search, ads, or connector validation that cannot be proven through local artifacts
- Stage 2 live-test realism that improves quality beyond static evidence
- Stage 3 derivative material that has future Stage 2 lineage

If local artifacts, Drive evidence, or GitHub indexes can prove the requirement with equal quality, the website remains not required.

## Planning Locks

```text
website_build_allowed=false
website_source_allowed=false
public_website_allowed=false
public_deployment_allowed=false
tracking_activation_allowed=false
gtm_publish_allowed=false
live_network_tracking_allowed=false
mcp_execution_allowed=false
drive_upload_allowed=false
stage_2_execution_allowed=false
stage_3_asset_creation_allowed=false
```

## Platform Placeholder Rule

GTM, GA4, Google Ads, Meta, LinkedIn, Search Console, Drive, and connector references remain placeholder-only in source and public records. Real runtime identifiers, account identifiers, connector artifacts, evidence files, local paths, and private client details remain outside the public repo.

## Next Gate

Phase 9 remains locked until a low-risk pilot service is selected and Stage 2 questioning proves that a website is genuinely needed.

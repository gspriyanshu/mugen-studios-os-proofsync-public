# Validators

This folder is reserved for public-safe validators.

Validators added here must be dependency-light, public-safe, and limited to public shell checks. They must not call MCPs, download Drive files, read secrets, deploy a website, mutate external platforms, create proof/demo assets, or publish outputs.

Phase 4B validator lanes:

- public export allowlist scan
- runtime config placeholder scan
- public manifest validation
- sanitized public schema validation
- blocked private content scan
- synthetic tracking/no-network scan

Run:

```text
npm run validate
```

These validators are gatekeepers only. Passing them does not approve website deployment, live tracking, MCP execution, Drive storage, Stage 2 execution, Stage 3 asset creation, service readiness, or public claims.

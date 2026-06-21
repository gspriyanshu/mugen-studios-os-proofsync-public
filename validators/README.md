# Validators

This folder is reserved for public-safe validators.

Validators added here must be dependency-light, public-safe, and limited to public shell checks. They must not call MCPs, download Drive files, read secrets, deploy a website, mutate external platforms, create proof/demo assets, or publish outputs.

Required future validator lanes:

- public export allowlist scan
- runtime config placeholder scan
- public manifest validation
- blocked private content scan
- synthetic tracking/no-network scan

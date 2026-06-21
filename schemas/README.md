# Schemas

This folder is reserved for generic public-safe schemas.

Current status:

```text
schema_import_allowed=true
schema_import_mode=sanitized_public_derivatives_only
private_bootstrap_schema_bulk_copy_allowed=false
required_before_schema_import=branch_protection_verified,direct_main_write_blocked,public_export_review_passed,runtime_config_validation_passed,public_manifest_validation_passed,public_schema_validation_passed,ci_validate_required
```

No schema in this repository may expose private source structure, account identifiers, Drive identifiers, MCP routes, client data, proof evidence, or service internals.

Imported schemas are non-authoritative public contracts. They do not permit external actions, runtime tracking, service readiness claims, or proof asset publication.

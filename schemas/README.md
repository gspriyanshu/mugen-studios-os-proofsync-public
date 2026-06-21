# Schemas

This folder is reserved for generic public-safe schemas.

Current status:

```text
schema_import_allowed=false
required_before_schema_import=branch_protection_verified,direct_main_write_blocked,public_export_review_passed,runtime_config_validation_passed,public_manifest_validation_passed
```

No schema in this repository may expose private source structure, account identifiers, Drive identifiers, MCP routes, client data, proof evidence, or service internals.

# V2.12 ProofSync Public Summary

V2.12 defines how MUGEN Studios OS can use a protected public execution repository without making that repository the source of truth.

The private MUGEN system remains the authority for composite services, skills, agents, stage records, quality decisions, and learning decisions. The public repository contains only sanitized execution shells, validators, prepared examples, and approved summaries.

## Boundary

Allowed here:

- public-safe validators
- placeholder-only schemas
- prepared-only examples
- short architecture summaries
- validation-only automation

Blocked here:

- private source documents
- private evidence
- client data
- local paths
- account identifiers
- Drive identifiers
- raw exports
- connector artifacts
- website deployment
- tracking activation
- service-readiness claims

## Operating Rule

Every public artifact must have a private authority record, a changed-file scope, a cache key, a safety scan, and a phase gate.

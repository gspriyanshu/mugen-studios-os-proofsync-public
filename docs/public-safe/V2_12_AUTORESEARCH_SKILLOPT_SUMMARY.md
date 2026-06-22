# V2.12 AutoResearch And SkillOpt Summary

AutoResearch and SkillOpt help improve services over time, but their outputs are not automatically accepted.

Accepted updates require private evaluator evidence, holdout or regression checks, a cache key, a changed-file scope, and a rollback note. Prepared examples may show the shape of a learning ledger, but they must not claim that a learning update was accepted.

## Cost Control

The public system uses:

- changed-file scope
- cache keys
- explicit invalidation triggers
- no broad private document mirroring
- no recursive private/public sync
- deferred learning decisions unless evaluator evidence exists

This keeps quality high without turning each requirement into a full rebuild.

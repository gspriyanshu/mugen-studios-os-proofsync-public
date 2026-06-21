# Public-Safe Change Checklist

## Scope

- [ ] This change is public-safe and reviewable.
- [ ] This change does not claim service readiness, proof readiness, deployment approval, tracking approval, MCP approval, or Route 5 approval.
- [ ] This change does not include private MUGEN source, client data, raw evidence, Drive identifiers, MCP logs/routes/outputs, account identifiers, private prompts, atomic skill packages, or composite internals.

## Runtime And Tracking

- [ ] Runtime IDs are placeholders only.
- [ ] No GTM, GA4, Google Ads, Meta, LinkedIn, Search Console, cookie, form, or conversion tracking is activated.
- [ ] Any Stage 2 tracking reference is synthetic/no-network only.

## Learning And Quality

- [ ] AutoResearch or SkillOpt references are derivative, evaluator-backed, and do not expose private ledgers.
- [ ] Token/time impact is narrow, changed-file scoped, and does not trigger broad regeneration.
- [ ] Stage 3/demo material, if referenced, has private Stage 2 lineage and separate release approval.

## Validation

- [ ] Public export scan passed or the change is scaffold-only.
- [ ] Runtime config validation passed or the change is scaffold-only.
- [ ] Public manifest validation passed or the change is scaffold-only.

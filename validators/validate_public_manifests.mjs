import { printResult, resolveTargetRoot, validatePublicManifestRoot } from "./public_safety.mjs";

const targetRoot = resolveTargetRoot();
printResult("validate-public-manifests", validatePublicManifestRoot(targetRoot), targetRoot);

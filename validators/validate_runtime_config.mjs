import { printResult, resolveTargetRoot, validateRuntimeConfigRoot } from "./public_safety.mjs";

const targetRoot = resolveTargetRoot();
printResult("validate-runtime-config", validateRuntimeConfigRoot(targetRoot), targetRoot);

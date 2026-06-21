import { printResult, resolveTargetRoot, scanPublicExportRoot } from "./public_safety.mjs";

const targetRoot = resolveTargetRoot();
printResult("scan-public-export", scanPublicExportRoot(targetRoot), targetRoot);

import fs from "node:fs";
import path from "node:path";

export type HuskyResult =
  | { present: true; hooksDir: string }
  | { present: false };

function packageHasHusky(repoRoot: string): boolean {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(pkg.dependencies?.husky ?? pkg.devDependencies?.husky);
  } catch {
    return false;
  }
}

export function detectHusky(repoRoot: string): HuskyResult {
  const hooksDir = path.join(repoRoot, ".husky");
  const hasHuskyDir = fs.existsSync(hooksDir) && fs.statSync(hooksDir).isDirectory();
  const hasHuskyDep = packageHasHusky(repoRoot);

  if (hasHuskyDir || hasHuskyDep) {
    return { present: true, hooksDir };
  }

  return { present: false };
}

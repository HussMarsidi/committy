import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import semver from "semver";

const PACKAGE_JSON = "package.json";

export function hasPackageJson(): boolean {
  return existsSync(path.join(process.cwd(), PACKAGE_JSON));
}

export function readCurrentVersion(): string {
  const pkgPath = path.join(process.cwd(), PACKAGE_JSON);

  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    if (pkg.version) {
      return pkg.version;
    }
  }

  const tagOutput = execSync("git tag --sort=-version:refname", {
    stdio: "pipe",
    encoding: "utf8",
  });

  const tags = tagOutput
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => /^v\d+\.\d+\.\d+$/.test(t));

  if (tags.length > 0) {
    return tags[0]!.slice(1);
  }

  throw new Error(
    "Could not determine current version. No package.json version field and no semver git tags found.",
  );
}

export function nextVersion(
  current: string,
  releaseType: "major" | "minor" | "patch",
): string {
  const next = semver.inc(current, releaseType);
  if (next === null) {
    throw new Error(`Invalid current version: ${current}`);
  }
  return next;
}

export function writePackageVersion(version: string): void {
  const pkgPath = path.join(process.cwd(), PACKAGE_JSON);
  if (!existsSync(pkgPath)) {
    return;
  }

  const raw = readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  pkg.version = version;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

import { existsSync } from "node:fs";
import path from "node:path";
import { parseBumpArgs } from "../bump/args.js";
import { detectBumpType } from "../bump/detect.js";
import {
  fetchRemoteTags,
  gitAdd,
  gitCommit,
  gitTag,
  isGitRepo,
  isWorkingTreeDirty,
} from "../bump/git.js";
import {
  hasPackageJson,
  nextVersion,
  readCurrentVersion,
  writePackageVersion,
} from "../bump/version.js";
import { generateChangelog } from "../changelog/generate.js";
import { writeChangelogFile, writeReleaseChangelog } from "../changelog/write.js";

async function bootstrapChangelogIfMissing(changelogPath: string): Promise<void> {
  if (existsSync(changelogPath)) {
    return;
  }

  const history = await generateChangelog({ from: null, init: true });
  if (history.trim()) {
    await writeChangelogFile(history, changelogPath);
  }
}

export async function runBumpCommand(args: string[]): Promise<void> {
  if (!isGitRepo()) {
    console.error("Not a git repository.");
    process.exit(1);
  }

  fetchRemoteTags();

  const bumpArgs = parseBumpArgs(args);

  if (isWorkingTreeDirty()) {
    console.error("Working tree is dirty. Commit or stash changes before bumping.");
    process.exit(1);
  }

  let releaseType: "major" | "minor" | "patch";

  if (bumpArgs.override) {
    releaseType = bumpArgs.override;
  } else {
    const recommendation = await detectBumpType();
    if (!recommendation) {
      console.log("Nothing to bump — no commits since the last tag.");
      process.exit(0);
    }
    releaseType = recommendation.releaseType;
  }

  const current = readCurrentVersion();
  const next = nextVersion(current, releaseType);

  if (bumpArgs.dryRun) {
    console.log(`Detected: ${releaseType}`);
    console.log(`Current:  ${current}`);
    console.log(`Next:     ${next}`);
    console.log("");
    console.log("--dry-run: no files written, no commit, no tag.");
    process.exit(0);
  }

  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  await bootstrapChangelogIfMissing(changelogPath);

  const content = await generateChangelog({
    version: next,
    from: null,
    init: false,
  });

  if (!content.trim()) {
    console.log("No releasable commits found.");
    process.exit(0);
  }

  await writeReleaseChangelog(content, changelogPath);

  if (hasPackageJson()) {
    writePackageVersion(next);
  }

  const files = ["CHANGELOG.md"];
  if (hasPackageJson()) {
    files.push("package.json");
  }
  gitAdd(files);
  gitCommit(next);

  if (!bumpArgs.noTag) {
    gitTag(next);
  }

  console.log(`Bumped ${current} → ${next} (${releaseType})`);
  if (!bumpArgs.noTag) {
    console.log(`Tagged v${next}`);
  }
}

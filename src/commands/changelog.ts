import { parseChangelogArgs } from "../changelog/args.js";
import { generateChangelog } from "../changelog/generate.js";
import { writeChangelog } from "../changelog/write.js";
import { isGitRepo } from "../bump/git.js";

export async function runChangelogCommand(args: string[]): Promise<void> {
  if (!isGitRepo()) {
    console.error("Not a git repository.");
    process.exit(1);
  }

  const { dryRun, from, all } = parseChangelogArgs(args);

  const content = await generateChangelog({
    version: "Unreleased",
    from,
    all,
  });

  if (!content.trim()) {
    console.log("No releasable commits found.");
    process.exit(0);
  }

  await writeChangelog({ content, dryRun, all });
}

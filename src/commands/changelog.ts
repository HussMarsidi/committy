import { parseChangelogArgs } from "../changelog/args.js";
import { generateChangelog } from "../changelog/generate.js";
import { fetchRemoteTags, isGitRepo } from "../bump/git.js";

export async function runChangelogCommand(args: string[]): Promise<void> {
  if (!isGitRepo()) {
    console.error("Not a git repository.");
    process.exit(1);
  }

  fetchRemoteTags();

  const { from } = parseChangelogArgs(args);

  const content = await generateChangelog({ from, init: false });

  if (!content.trim()) {
    console.log("No releasable commits found.");
    process.exit(0);
  }

  process.stdout.write(content);
}

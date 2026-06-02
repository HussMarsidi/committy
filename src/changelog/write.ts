import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WriteOptions = {
  content: string;
  dryRun: boolean;
  all: boolean;
  filePath?: string;
};

export async function writeChangelog(options: WriteOptions): Promise<void> {
  const { content, dryRun, all } = options;
  const filePath = options.filePath ?? path.join(process.cwd(), "CHANGELOG.md");

  if (dryRun) {
    process.stdout.write(content);
    return;
  }

  if (all) {
    await writeFile(filePath, content);
    console.log("Changelog written to CHANGELOG.md");
    return;
  }

  let existing = "";
  try {
    existing = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const combined = existing ? `${content}\n${existing}` : content;
  await writeFile(filePath, combined);
  console.log("Changelog written to CHANGELOG.md");
}

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UNRELEASED_HEADING = /^## (?:\[Unreleased\]|Unreleased\b)/;

/** Removes a leading Unreleased section so repeated prepends do not duplicate it. */
export function stripLeadingUnreleasedSection(content: string): string {
  const lines = content.split("\n");
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === "") {
    idx++;
  }
  if (idx >= lines.length || !UNRELEASED_HEADING.test(lines[idx])) {
    return content;
  }

  let nextSection = lines.length;
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      nextSection = i;
      break;
    }
  }

  return lines.slice(nextSection).join("\n").replace(/^\n+/, "");
}

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

  const existingWithoutUnreleased = existing
    ? stripLeadingUnreleasedSection(existing)
    : "";
  const combined = existingWithoutUnreleased
    ? `${content}\n${existingWithoutUnreleased}`
    : content;
  await writeFile(filePath, combined);
  console.log("Changelog written to CHANGELOG.md");
}

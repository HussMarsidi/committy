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

/** Writes changelog content to disk (no stdout). Used by bump for bootstrap. */
export async function writeChangelogFile(
  content: string,
  filePath?: string,
): Promise<void> {
  const target = filePath ?? path.join(process.cwd(), "CHANGELOG.md");
  await writeFile(target, content);
}

/** Writes a release section for `gcv bump` (prepends, replaces stale Unreleased). */
export async function writeReleaseChangelog(
  content: string,
  filePath?: string,
): Promise<void> {
  const target = filePath ?? path.join(process.cwd(), "CHANGELOG.md");

  let existing = "";
  try {
    existing = await readFile(target, "utf8");
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
  await writeFile(target, combined);
}

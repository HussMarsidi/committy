export type ChangelogArgs = {
  from: string | null;
};

export function parseChangelogArgs(args: string[]): ChangelogArgs {
  let from: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--dry-run") {
      console.error(
        "gcv changelog always prints to stdout. Use gcv bump to write CHANGELOG.md.",
      );
      process.exit(1);
    }

    if (arg === "--all" || arg === "--init") {
      console.error(
        "gcv changelog is preview-only. Use gcv bump to create or update CHANGELOG.md.",
      );
      process.exit(1);
    }

    if (arg === "--from") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("--from requires a value");
        process.exit(1);
      }
      from = value;
      i++;
      continue;
    }

    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }

  return { from };
}

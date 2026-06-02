export type ChangelogArgs = {
  dryRun: boolean;
  from: string | null;
  all: boolean;
};

export function parseChangelogArgs(args: string[]): ChangelogArgs {
  let dryRun = false;
  let from: string | null = null;
  let all = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--all") {
      all = true;
      continue;
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

  if (all) {
    from = null;
  }

  return { dryRun, from, all };
}

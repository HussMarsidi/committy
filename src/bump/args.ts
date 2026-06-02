export type BumpArgs = {
  override: "major" | "minor" | "patch" | null;
  dryRun: boolean;
  noTag: boolean;
};

export function parseBumpArgs(args: string[]): BumpArgs {
  let override: BumpArgs["override"] = null;
  let dryRun = false;
  let noTag = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--no-tag") {
      noTag = true;
      continue;
    }

    if (arg === "--major" || arg === "--minor" || arg === "--patch") {
      if (override !== null) {
        console.error("Only one of --major, --minor, or --patch may be specified");
        process.exit(1);
      }
      override = arg.slice(2) as BumpArgs["override"];
      continue;
    }

    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }

  return { override, dryRun, noTag };
}

export type BranchInlineResult =
  | { mode: "create"; name: string }
  | { mode: "validate"; name: string }
  | { mode: "interactive" };

export class BranchArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchArgsError";
  }
}

export function parseBranchArgs(args: string[]): BranchInlineResult {
  if (args.length === 0) {
    return { mode: "interactive" };
  }

  if (args[0] === "validate") {
    if (args.length < 2) {
      throw new BranchArgsError("validate requires a branch name");
    }
    return { mode: "validate", name: args[1] };
  }

  if (args.length === 1) {
    return { mode: "create", name: args[0] };
  }

  throw new BranchArgsError(`Unexpected arguments: ${args.join(" ")}`);
}

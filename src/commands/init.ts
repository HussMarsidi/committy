import fs from "node:fs";
import path from "node:path";
import {
  createDefaultConfig,
  DEFAULT_BRANCH_PATTERNS,
  DEFAULT_BRANCH_TYPES,
} from "../config/defaults.js";
import type { GcBranchConfig, GcConfig, GcScope } from "../config/types.js";
import { detectRepo } from "../git/repo.js";
import { installHooks } from "../hooks/install.js";
import {
  PromptCancelledError,
  promptConfirm,
  promptInput,
} from "../prompt/commit-prompt.js";

async function collectTypes(): Promise<string[]> {
  const types: string[] = [];

  while (true) {
    const name = (await promptInput("Commit type")).trim();
    if (!name) {
      console.log("Type name is required.");
      continue;
    }

    if (types.includes(name)) {
      console.log(`Type "${name}" already added.`);
      continue;
    }

    types.push(name);

    const addAnother = await promptConfirm("Add another type?");
    if (!addAnother) {
      break;
    }
  }

  return types;
}

async function collectBranchTypes(): Promise<string[]> {
  const types: string[] = [];

  while (true) {
    const name = (await promptInput("Branch type")).trim();
    if (!name) {
      console.log("Branch type is required.");
      continue;
    }

    if (types.includes(name)) {
      console.log(`Branch type "${name}" already added.`);
      continue;
    }

    types.push(name);

    const addAnother = await promptConfirm("Add another branch type?");
    if (!addAnother) {
      break;
    }
  }

  return types;
}

async function collectBranchPatterns(): Promise<string[]> {
  const patterns: string[] = [];

  while (true) {
    const pattern = (await promptInput("Branch pattern (e.g. {type}/{description})")).trim();
    if (!pattern) {
      console.log("Pattern is required.");
      continue;
    }

    if (patterns.includes(pattern)) {
      console.log(`Pattern "${pattern}" already added.`);
      continue;
    }

    patterns.push(pattern);

    const addAnother = await promptConfirm("Add another pattern?");
    if (!addAnother) {
      break;
    }
  }

  return patterns;
}

async function collectScopes(): Promise<GcScope[]> {
  const scopes: GcScope[] = [];

  while (true) {
    const name = (await promptInput("Scope name")).trim();
    if (!name) {
      console.log("Scope name is required.");
      continue;
    }

    const team = (await promptInput("Team prefix (optional, press Enter to skip)")).trim();
    scopes.push(team ? { name, team } : { name });

    const addAnother = await promptConfirm("Add another scope?");
    if (!addAnother) {
      break;
    }
  }

  return scopes;
}

async function collectBranchConfig(): Promise<GcBranchConfig | undefined> {
  const addBranches = await promptConfirm("Add branch naming conventions?");
  if (!addBranches) {
    return undefined;
  }

  const useDefaultTypes = await promptConfirm("Add default branch types?");
  const types = useDefaultTypes
    ? [...DEFAULT_BRANCH_TYPES]
    : await collectBranchTypes();

  const addCustomPatterns = await promptConfirm("Add custom patterns?");
  const allowed = addCustomPatterns
    ? await collectBranchPatterns()
    : [...DEFAULT_BRANCH_PATTERNS];

  return { allowed, types };
}

function printHookInstallResult(repoRoot: string, result: ReturnType<typeof installHooks>): void {
  const gcHook = path.join(repoRoot, ".gc/hooks/post-checkout");
  if (result.mode === "gcHooks") {
    console.log(`Installed git hooks (core.hooksPath): ${result.hooksDir}`);
    console.log(`  wrote ${gcHook}`);
    return;
  }

  console.log(`Installed git hooks (husky delegation): ${result.huskyHooksDir}`);
  console.log(`  wrote ${gcHook}`);
  console.log(`  updated ${path.join(result.huskyHooksDir, "post-checkout")}`);
}

export async function runInitCommand(): Promise<void> {
  try {
    const { repoRoot, isAtRoot } = detectRepo();

    if (!isAtRoot) {
      const proceed = await promptConfirm(
        "Not at repo root. Write .gc.json here anyway?",
      );
      if (!proceed) {
        process.exit(0);
      }
    }

    const targetPath = path.join(process.cwd(), ".gc.json");

    if (fs.existsSync(targetPath)) {
      const overwrite = await promptConfirm(".gc.json already exists. Overwrite?");
      if (!overwrite) {
        process.exit(0);
      }
    }

    const addDefaults = await promptConfirm("Add default conventional commit types?");
    const addScopesNow = await promptConfirm("Add scopes now?");

    let config: GcConfig;

    if (addDefaults) {
      config = createDefaultConfig();
    } else {
      const types = await collectTypes();
      config = { types, scopes: [] };
    }

    if (addScopesNow) {
      config.scopes = await collectScopes();
    }

    const branches = await collectBranchConfig();
    if (branches) {
      config.branches = branches;
    }

    fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    console.log(`Created ${targetPath}`);

    const installHookFiles = await promptConfirm(
      "Install git hooks for branch validation?",
    );
    if (installHookFiles && repoRoot) {
      const result = installHooks(repoRoot);
      printHookInstallResult(repoRoot, result);
    } else if (installHookFiles && !repoRoot) {
      console.log("Not inside a git repository — hooks were not installed.");
    }
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      process.exit(0);
    }
    throw error;
  }
}

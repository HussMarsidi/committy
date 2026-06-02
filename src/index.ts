#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { runCommitCommand } from "./commands/commit.js";
import { runInitCommand } from "./commands/init.js";

const HELP_TEXT = `Usage: gcv [command] [options] [type] [scope] [message...]

A lightweight global CLI for enforcing git commit conventions.

Commands:
  gcv              Interactive commit prompt
  gcv init         Scaffold .gc.json in current directory
  gcv --help       Show this help
  gcv --version    Show version

Inline mode:
  gcv <type> [scope] <message...>

  Examples:
    gcv feat auth fix svg images not loading
    gcv fix update readme
    gcv fix auth                    (if "auth" is a configured scope, prompts for message)

  With exactly 2 args, the second token is checked against configured scopes:
    - If it matches a scope → type + scope, prompt for message
    - Otherwise → type + message (no scope)

Config:
  Optional .gc.json in repo (walked up from cwd).
  Malformed config prints an error and exits — no silent fallback.

Docs: https://github.com/committy/committy
`;

function getVersion(): string {
  const pkgPath = path.join(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  return pkg.version;
}

function printHelp(): void {
  process.stdout.write(HELP_TEXT);
}

function parseArgs(argv: string[]): {
  command: "help" | "version" | "init" | "commit";
  inlineArgs: string[];
} {
  if (argv.length === 0) {
    return { command: "commit", inlineArgs: [] };
  }

  const [first, ...rest] = argv;

  if (first === "--help" || first === "-h") {
    return { command: "help", inlineArgs: [] };
  }

  if (first === "--version" || first === "-v") {
    return { command: "version", inlineArgs: [] };
  }

  if (first === "init") {
    return { command: "init", inlineArgs: rest };
  }

  if (first.startsWith("-")) {
    console.error(`Unknown flag: ${first}`);
    printHelp();
    process.exit(1);
  }

  return { command: "commit", inlineArgs: argv };
}

async function main(): Promise<void> {
  const { command, inlineArgs } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "help":
      printHelp();
      break;
    case "version":
      console.log(getVersion());
      break;
    case "init":
      if (inlineArgs.length > 0) {
        console.error("gcv init does not accept additional arguments.");
        process.exit(1);
      }
      await runInitCommand();
      break;
    case "commit":
      await runCommitCommand(inlineArgs);
      break;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

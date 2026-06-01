# konven (`gcv`) — Product Spec

> A lightweight global CLI for enforcing git commit conventions across any project, any stack. Zero project dependencies.

---

## Problem

Teams want consistent commit messages but the tooling to enforce it (commitizen, husky, commitlint) is heavy, wired into the project, and requires every developer to configure it per repo. The result: conventions are documented but not followed.

---

## Solution

A globally installed CLI (`gcv`) that reads an optional `.gc.json` config committed to the repo. It guides the developer through a valid conventional commit via interactive prompt or inline syntax. No project install. No hooks. No devDependencies.

---

## Installation

```bash
npm install -g konven
```

Single command. Works in any repo from that point forward.

---

## Commands

### `gcv init`

Scaffolds a `.gc.json` config file in the **current working directory**.

```
? Add default conventional commit types? Yes
? Add scopes now or later? Now / Later
```

Generates `.gc.json` in the current directory. Intended to be committed to the repo.

**Location rules:**

- File is always written to `./.gc.json` relative to cwd — not auto-redirected to repo root.
- If cwd is inside a git repo but **not** the repo root, prompt for confirmation before writing:
  ```
  Not at repo root. Write .gc.json here anyway?
  ```
- If the file already exists, prompt for overwrite confirmation.

---

### `gcv` — Interactive mode

Full guided prompt. Reads config if present, uses defaults if not.

```
? Type:    feat
? Scope:   auth (optional, press Enter to skip)
? Message: fix svg images not loading
```

Scope is always optional. Skipping produces `feat: message` not `feat(): message`.

Output with scope: `git commit -m "feat(auth): fix svg images not loading"`
Output without scope: `git commit -m "feat: fix svg images not loading"`

If scope has a team prefix defined in config:
Output: `git commit -m "feat(auth): PCUST fix svg images not loading"`

---

### `gcv <type> [scope] <message...>` — Inline mode

Fast path for power users. Scope is optional.

**Argument parsing rules:**

- 1 arg → treated as message, full prompt for type and scope
- 2 args → disambiguated (see below)
- 3+ args → `type` + `scope` + `message (rest joined)`

**2-arg disambiguation** (config present):

When exactly two args are provided (`gcv <type> <token>`), the second token is resolved using an O(1) lookup against configured scopes:

- If `<token>` matches a configured scope name → parse as `type` + `scope`, message missing → prompt for message only
- Otherwise → parse as `type` + `message`, no scope

When no config is present, 2 args always mean `type` + `message` (free text, no scope validation).

```bash
gcv feat auth fix svg images not loading  # → feat(auth): fix svg images not loading
gcv fix update readme                     # → fix: update readme (no scope)
gcv fix auth                              # → scope "auth" in config → prompt for message only
gcv fix readme                            # → "readme" not a scope → fix: readme
```

**Validation rules:**

- If `type` is not in config types → drop into prompt, type field highlighted, invalid value shown
- If `scope` is not in config scopes → drop into prompt, scope field highlighted, invalid value shown
- If `message` is missing → drop into prompt, message field focused
- If no config exists → type and scope are free text, no validation

The inline path never hard-fails. It degrades gracefully into the prompt.

---

### `gcv --help`

Shows usage, available commands, and links to docs.

---

### `gcv --version`

Shows installed version.

---

## Config File

### Format

JSON only — `.gc.json`. Universal, zero parsing dependency, every language and editor understands it.

```json
{
  "types": [
    "feat",
    "fix",
    "chore",
    "docs",
    "refactor",
    "test",
    "style",
    "perf"
  ],
  "scopes": [
    { "name": "auth", "team": "PCUST" },
    { "name": "payment", "team": "PCUST" },
    { "name": "dashboard", "team": "PINT" },
    { "name": "deps" }
  ]
}
```

### Config rules

- Config file is **optional**. Tool works without it using conventional commit defaults.
- Config is **project-level** — committed to repo, shared by team.
- `team` field on a scope is **optional**. Scopes without it produce no prefix.
- Config is resolved by walking up from current directory to repo root.
- **Malformed config fails upfront** — if `.gc.json` exists but is invalid JSON or fails schema validation, print a clear error with file path and reason. Do not silently fall back to defaults.

### Schema validation

- `types` — required, non-empty array of strings
- `scopes` — required array of objects with `name` (string, required) and optional `team` (string)
- Scope names must be unique

---

## Commit Output Format

Standard: `type(scope): message`

With team prefix: `type(scope): TEAM message`

### Default types (when no config)

```
feat, fix, chore, docs, refactor, test, style, perf, ci, build, revert
```

These follow the Conventional Commits v1.0.0 specification.

---

## UX Behaviour

### Prompt UI

- Arrow keys to select type and scope
- Type to filter/search within list
- Enter to confirm each field
- `Esc` to cancel without committing

### Inline fallback to prompt

When inline args are partially invalid or incomplete, the tool does not error and exit. It opens the prompt with:

- Valid fields pre-filled and **locked** (not editable — convention is enforced)
- Invalid or missing fields highlighted with the invalid value shown
- Cursor placed on the first invalid or missing field (order: type → scope → message)

Locked fields are displayed but skipped during prompting. The developer cannot override a valid inline value in fallback mode.

### No config present

- Tool still works
- No validation on type or scope — free text
- Uses default conventional commit type list for prompt suggestions
- 2-arg inline always parses as `type` + `message`

### Staged files check

Before committing, `gcv` checks if there are staged files. If nothing is staged:

```
Nothing staged. Run `git add` first.
```

Exits cleanly. Does not commit.

---

## What It Does Not Do

- No husky integration
- No commitlint wiring
- No changelog generation
- No version bumping
- No CI/CD hooks
- No per-user config (only project-level)
- No remote/SSH support
- No GUI

These are deliberate omissions. Other tools do these well. `konven` stays focused.

---

## Tech Stack

| Concern        | Choice                   | Why                                        |
| -------------- | ------------------------ | ------------------------------------------ |
| Language       | TypeScript               | Type safety, better contributor experience |
| Prompt UI      | `@inquirer/prompts`      | Lightweight, no inquirer bloat             |
| Config parsing | native `JSON.parse`      | Built-in, zero dependency                  |
| Git execution  | `child_process.execSync` | Built-in, zero dependency                  |
| Distribution   | npm global install       | Single install, works everywhere           |

**Total runtime dependencies: 1** — `@inquirer/prompts` only.

---

## File Structure

```
konven/
├── src/
│   ├── index.ts                  # CLI entry, arg parsing
│   ├── commands/
│   │   ├── init.ts               # gcv init — generates .gc.json
│   │   └── commit.ts             # prompt + inline + git exec
│   ├── config/
│   │   ├── types.ts              # GcConfig, LoadedConfig, ConfigIndexes
│   │   ├── defaults.ts           # default types list
│   │   ├── indexes.ts            # Set/Map indexes for O(1) lookup
│   │   └── loader.ts             # finds + parses .gc.json
│   ├── parse/
│   │   ├── types.ts              # ParsedInline result types
│   │   └── inline.ts             # inline arg parsing + disambiguation
│   ├── prompt/
│   │   ├── fields.ts               # PromptState, locked field model
│   │   └── commit-prompt.ts        # inquirer prompts
│   ├── format/
│   │   └── message.ts              # commit message string builder
│   ├── git/
│   │   ├── repo.ts                 # repo root detection
│   │   ├── staged.ts               # staged files check
│   │   └── commit.ts               # git commit execution
│   └── validate.ts                 # type/scope validation helpers
├── .gc.json                        # dogfood — konven uses itself
├── package.json
├── tsconfig.json
└── README.md
```

---

## MVP Scope (v0.1.0)

Ship these, nothing else:

- [ ] `gcv` — interactive prompt
- [ ] `gcv <type> [scope] <message>` — inline with graceful fallback
- [ ] `gcv init` — generates `.gc.json` in cwd with location confirm
- [ ] JSON config support via native `JSON.parse`
- [ ] Malformed config error upfront
- [ ] 2-arg scope disambiguation via config lookup
- [ ] Optional scope (prompt + inline)
- [ ] Team prefix per scope
- [ ] Locked valid fields in inline fallback
- [ ] Staged files check
- [ ] Default types when no config

---

## Out of Scope (revisit later)

- YAML / TOML config formats
- Breaking change support (`!` flag or `BREAKING CHANGE` footer)
- Emoji support per type
- `gcv log` — pretty print recent commits
- Shell completions (zsh, bash, fish)
- Monorepo scope detection

---

## Success Metric

A new developer joins a project, clones the repo, runs `npm i -g konven`, and from that point every commit they make follows the team convention — without reading a contributing guide, without configuring anything, and without the repo having any extra devDependencies.

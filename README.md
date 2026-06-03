[![CI](https://github.com/HussMarsidi/committy/actions/workflows/ci.yml/badge.svg)](https://github.com/HussMarsidi/committy/actions/workflows/ci.yml)

# committy (`gcv`)

A lightweight global CLI for conventional commits. Install once, use in any repo. No project config required.

```bash
npm install -g @hussmarsidi/committy
```

---

## Quick start

You need Node 18+ and a git repo with staged files.

**1. Install committy globally:**

```bash
npm install -g @hussmarsidi/committy
```

**2. Stage something:**

```bash
git add .
```

**3. Run the interactive prompt:**

```bash
gcv
```

You'll see:

```
? Type:    feat
? Scope:   (optional, press Enter to skip)
? Message: fix svg images not loading
```

Select a type, optionally pick a scope, write your message. committy runs `git commit` for you.

---

## Common workflows

### Commit interactively

```bash
gcv
```

Guides you through type → scope → message. Scope is always optional — skipping it produces `feat: message`, not `feat(): message`.

### Commit inline (fast path)

```bash
gcv feat auth fix svg images not loading
# → git commit -m "feat(auth): fix svg images not loading"

gcv fix update readme
# → git commit -m "fix: update readme"
```

If the args don't fully resolve (invalid type, missing message), committy drops into the prompt with valid fields pre-filled and locked. You only answer what's missing.

### Create a branch interactively

```bash
gcv branch
```

Prompts you to pick a pattern, fill in each placeholder, then runs `git switch -c` with the validated name.

### Create a branch inline

```bash
gcv branch feat/add-login-page
# → git switch -c feat/add-login-page

gcv branch feat/PROJ-123-add-login-page
# → git switch -c feat/PROJ-123-add-login-page
```

Validates against your `branches` config before creating. If no config is present, skips validation and creates the branch directly.

### Validate a branch name

```bash
gcv branch validate feat/add-login-page
# exits 0 if valid, 1 if not
```

Used automatically by the git hook installed via `gcv init`.

### Set up a team config

```bash
gcv init
```

Walks you through creating `.gc.json` in the current directory. Commit this file so the whole team shares the same types, scopes, and branch rules.

v0.2 adds two optional init steps: branch naming config and git hook installation. committy detects whether Husky is present and adapts — no manual hook wiring needed.

If you're not at the repo root, committy warns you before writing.

### Preview or bootstrap a changelog

```bash
gcv changelog
```

Prints unreleased commits since the last git tag to stdout (no file written). Use `--from <tag>` to preview from a specific tag. **`gcv bump` is the only command that writes `CHANGELOG.md`** — on the first run it bootstraps full tagged history automatically if the file is missing.

### Bump the version

```bash
gcv bump
```

Reads commits since the last tag, auto-detects the semver bump type, generates the changelog, updates `package.json`, commits the release, and creates a git tag. Working tree must be clean.

```bash
gcv bump --dry-run
# Detected: minor
# Current:  0.3.0
# Next:     0.4.0
#
# --dry-run: no files written, no commit, no tag.
```

### Use an existing config

Nothing to do. committy walks up from your current directory to the repo root looking for `.gc.json`. If it finds one, it uses it. If not, it falls back to the [default type list](#default-types).

---

## Config reference

`.gc.json` is optional. When present it must be valid JSON — malformed config prints an error and exits. No silent fallback.

### Schema

```json
{
  "types": ["feat", "fix", "chore", "docs", "refactor", "test"],
  "scopes": [
    { "name": "auth", "team": "PCUST" },
    { "name": "payment", "team": "PCUST" },
    { "name": "dashboard", "team": "PINT" },
    { "name": "deps" }
  ],
  "branches": {
    "allowed": ["{type}/{description}", "{type}/{ticket}-{description}"],
    "types": ["feat", "fix", "hotfix", "release", "chore"]
  }
}
```

| Field                | Type       | Required | Description                                              |
| -------------------- | ---------- | -------- | -------------------------------------------------------- |
| `types`              | `string[]` | Yes      | Non-empty list of allowed commit types                   |
| `scopes`             | `object[]` | Yes      | List of scope definitions (can be empty `[]`)            |
| `scopes[].name`      | `string`   | Yes      | Scope identifier used in commits                         |
| `scopes[].team`      | `string`   | No       | Team prefix inserted before the message                  |
| `branches`           | `object`   | No       | Branch naming config — omit to skip branch validation    |
| `branches.allowed`   | `string[]` | Yes*     | Patterns using `{type}`, `{ticket}`, `{description}`     |
| `branches.types`     | `string[]` | Yes*     | Allowed values for the `{type}` placeholder              |

\* Required when `branches` is present.

Placeholder rules: `{type}` matches values from `branches.types`; `{ticket}` matches `PROJ-123` format; `{description}` matches kebab-case words.

Scope names must be unique. Scopes without `team` produce no prefix.

### Team prefix

When a scope has a `team` value, the commit message becomes:

```
type(scope): TEAM message
```

Example with `{ "name": "auth", "team": "PCUST" }`:

```
feat(auth): PCUST fix svg images not loading
```

### Config resolution

committy walks up from `cwd` to the repo root, checking each directory for `.gc.json`. The first file found wins. If none is found, [default types](#default-types) are used and scope validation is skipped.

---

## Command reference

### `gcv`

Interactive commit prompt. Loads config if present, uses defaults if not.

### `gcv <type> [scope] <message...>`

Inline commit. Argument parsing rules:

| Args    | Parsed as                                              |
| ------- | ------------------------------------------------------ |
| 1 arg   | message only — prompts for type and scope              |
| 2 args  | see disambiguation below                               |
| 3+ args | `type` + `scope` + `message (rest joined with spaces)` |

**2-arg disambiguation** (config present):

The second token is checked against configured scope names:

- Matches a scope → parsed as `type + scope`, prompts for message
- No match → parsed as `type + message`, no scope

Without config, 2 args always mean `type + message`.

**Validation fallback:**

Invalid or missing fields don't hard-fail. committy opens the prompt with valid fields locked and the cursor on the first problem field (type → scope → message).

### `gcv branch`

Interactive branch name builder. Reads `branches` config, prompts for each placeholder, runs `git switch -c` with the validated name.

### `gcv branch <name>`

Inline branch create. Validates against `branches` config then runs `git switch -c`. Skips validation if no `branches` config is present.

### `gcv branch validate <name>`

Validates a branch name against config. Exits 0 if valid, 1 if not. No branch is created. Used by the git hook installed via `gcv init`.

### `gcv init`

Scaffolds `.gc.json` in the current directory. Prompts for commit types, scopes, branch config, and optionally installs git hooks. Detects Husky automatically — no manual hook wiring needed.

If cwd is inside a git repo but not the root, committy asks for confirmation before writing. If `.gc.json` already exists, asks before overwriting.

### `gcv changelog`

Previews changelog markdown on stdout. Only commits following the Conventional Commits convention appear in the output. Never writes `CHANGELOG.md`.

| Flag | Description |
| --- | --- |
| `--from <tag>` | Preview from a specific git tag or commit |

### `gcv bump`

Auto-detects the semver bump type from commits since the last tag, generates the changelog, bumps `package.json` (if present), commits, and creates a git tag. If `CHANGELOG.md` does not exist, full tagged history is written first, then the new release section is prepended — no extra flags or setup step.

Bump type inference: `feat` → minor, `fix` / `chore` / others → patch, breaking change footer → major.

Working tree must be clean before running.

| Flag | Description |
| --- | --- |
| `--major` / `--minor` / `--patch` | Override the detected bump type |
| `--dry-run` | Print detected type and next version — no changes made |
| `--no-tag` | Skip git tag creation |

### `gcv --help` / `-h`

Prints usage.

### `gcv --version` / `-v`

Prints the installed version.

---

## Default types

Used when no config is present:

```
feat  fix  chore  docs  refactor  test  style  perf  ci  build  revert
```

These follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

---

## License

MIT

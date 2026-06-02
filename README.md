# konven (`gcv`)

A lightweight global CLI for conventional commits. Install once, use in any repo. No project config required.

```bash
npm install -g konven
```

---

## Quick start

You need Node 18+ and a git repo with staged files.

**1. Install konven globally:**

```bash
npm install -g konven
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

Select a type, optionally pick a scope, write your message. konven runs `git commit` for you.

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

If the args don't fully resolve (invalid type, missing message), konven drops into the prompt with valid fields pre-filled and locked. You only answer what's missing.

### Set up a team config

```bash
gcv init
```

Walks you through creating `.gc.json` in the current directory. Commit this file so the whole team shares the same types and scopes.

If you're not at the repo root, konven warns you before writing.

### Use an existing config

Nothing to do. konven walks up from your current directory to the repo root looking for `.gc.json`. If it finds one, it uses it. If not, it falls back to the [default type list](#default-types).

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
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `types` | `string[]` | Yes | Non-empty list of allowed commit types |
| `scopes` | `object[]` | Yes | List of scope definitions (can be empty `[]`) |
| `scopes[].name` | `string` | Yes | Scope identifier used in commits |
| `scopes[].team` | `string` | No | Team prefix inserted before the message |

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

konven walks up from `cwd` to the repo root, checking each directory for `.gc.json`. The first file found wins. If none is found, [default types](#default-types) are used and scope validation is skipped.

---

## Command reference

### `gcv`

Interactive commit prompt. Loads config if present, uses defaults if not.

### `gcv <type> [scope] <message...>`

Inline commit. Argument parsing rules:

| Args | Parsed as |
|---|---|
| 1 arg | message only — prompts for type and scope |
| 2 args | see disambiguation below |
| 3+ args | `type` + `scope` + `message (rest joined with spaces)` |

**2-arg disambiguation** (config present):

The second token is checked against configured scope names:

- Matches a scope → parsed as `type + scope`, prompts for message
- No match → parsed as `type + message`, no scope

Without config, 2 args always mean `type + message`.

**Validation fallback:**

Invalid or missing fields don't hard-fail. konven opens the prompt with valid fields locked and the cursor on the first problem field (type → scope → message).

### `gcv init`

Scaffolds `.gc.json` in the current directory. Prompts:

- Add default conventional commit types?
- Add scopes now or later?

If cwd is inside a git repo but not the root, konven asks for confirmation before writing. If `.gc.json` already exists, asks before overwriting.

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

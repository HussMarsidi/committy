# How committy works

This document explains the design decisions behind committy — why it works the way it does, and what tradeoffs were made. It's not a usage guide; see the [README](../README.md) for that.

---

## Why a global CLI instead of per-project hooks

The standard approach to enforcing commit conventions is commitizen + husky + commitlint, wired into `package.json` as devDependencies. This works, but it has a fundamental problem: it puts the burden on the repo. Every project needs the tooling configured, every developer needs to `npm install` before the hooks activate, and the setup silently stops working if someone skips the install.

The insight behind committy is that commit conventions are a _developer habit_, not a _project artifact_. The convention belongs in the repo (via `.gc.json`), but the enforcement tooling belongs on the developer's machine.

A globally installed binary sidesteps all of it: install once, and every repo you touch benefits — without touching `package.json`, without hooks, without CI setup.

The tradeoff is that committy can't _force_ developers to use it the way a git hook can. It relies on the developer choosing to run `gcv` instead of `git commit`. This is a deliberate choice. Tooling that feels optional but is genuinely faster tends to get adopted; tooling that intercepts and blocks tends to get bypassed.

---

## The 2-arg disambiguation

The most non-obvious behavior in committy is how it handles exactly two inline arguments.

```bash
gcv fix auth        # what does this mean?
gcv fix update-readme   # what about this?
```

The natural reading of `gcv <type> <token>` is ambiguous: is `token` a scope or the message?

committy resolves this with a single lookup: if a `.gc.json` is present and `token` exactly matches a configured scope name, it's treated as a scope and committy prompts for the message. Otherwise it's treated as the message, with no scope.

```bash
# .gc.json has scope "auth"
gcv fix auth          → type=fix, scope=auth, prompts for message
gcv fix update-readme → type=fix, message="update-readme", no scope
```

This works because scope names are typically short identifiers (`auth`, `payment`, `deps`), while messages are typically phrases. The collision space is small in practice, and the behaviour is deterministic and predictable once you know the rule.

Without a config, 2 args always mean `type + message`. There's nothing to look up, so no ambiguity.

The lookup is O(1) — config scopes are indexed into a `Set<string>` at load time.

---

## Inline fallback instead of hard errors

When you give committy invalid or incomplete inline args, it doesn't error and exit. It opens the prompt with whatever you gave it pre-filled and locked, cursor on the first problem.

```bash
gcv badtype auth fix the thing
# "badtype" not in config → opens prompt, type field highlighted
# scope and message are pre-filled and locked
```

This is intentional. The inline path is a fast path for experienced users, not a strict parser. Degrading to the prompt preserves the work you've already done (you typed the scope and message) while correcting only what's wrong.

Locked fields enforce the convention: once committy accepts a value as valid, it can't be overridden in the prompt. The developer made a deliberate inline choice; committy honours it.

---

## Config validation upfront

If `.gc.json` exists but is malformed — invalid JSON, wrong schema, duplicate scope names — committy prints a clear error with the file path and reason, then exits. It does not silently fall back to defaults.

This is a stricter choice than most tools make. The reason: silent fallback hides mistakes. A developer commits with `"fix"` (not in the custom type list) thinking committy validated it, when actually committy ignored the broken config and used defaults. The commit message looks fine locally, the convention is broken silently.

Failing loudly keeps the config honest. A broken config is a config that needs fixing, not a config to ignore.

---

## What committy deliberately doesn't do

**No git hooks.** committy is a replacement for the commit workflow, not middleware on top of it. Adding hooks would recreate the per-project dependency problem it was designed to avoid.

**No changelog generation.** Tools like `standard-version` and `release-please` do this well and integrate with CI. committy's job ends at the commit message.

**No per-user config.** The only config is `.gc.json`, committed to the repo. This is intentional — conventions are team agreements, not personal preferences. A per-user config that overrides team scopes defeats the purpose.

**No YAML or TOML.** JSON is the lowest common denominator: every language, every editor, every CI environment understands it with zero dependencies. The config is simple enough that JSON's verbosity isn't a problem.

**No breaking change support** (yet). The `!` flag and `BREAKING CHANGE` footer from the Conventional Commits spec are real, but they're also edge cases for most teams. Adding them to the prompt without a clear need would complicate the UX. This is the most likely thing to add in v0.2.

---

## The one dependency

committy has exactly one runtime dependency: `@inquirer/prompts`. It handles the interactive prompt UI — arrow-key selection, search/filter, Enter to confirm, Esc to cancel.

Everything else — JSON parsing, git execution, file system traversal — uses Node built-ins. This keeps the install fast and the dependency surface small.

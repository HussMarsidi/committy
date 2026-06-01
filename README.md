# konven (`gcv`)

A lightweight global CLI for enforcing git commit conventions across any project. Zero project dependencies.

## Install

```bash
npm install -g konven
```

## Usage

### Interactive commit

```bash
gcv
```

### Inline commit

```bash
gcv feat auth fix svg images not loading
gcv fix update readme
```

With exactly two args, the second token is checked against configured scopes in `.gc.json`:

- Matches a scope → `type` + `scope`, prompts for message
- Otherwise → `type` + `message`

### Init config

```bash
gcv init
```

Creates `.gc.json` in the current directory.

## Config

Optional `.gc.json` in your repo:

```json
{
  "types": ["feat", "fix", "chore"],
  "scopes": [
    { "name": "auth", "team": "PCUST" },
    { "name": "deps" }
  ]
}
```

Malformed config prints an error and exits — no silent fallback to defaults.

## License

MIT

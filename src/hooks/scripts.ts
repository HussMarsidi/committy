export function postCheckoutScript(): string {
  return `#!/bin/sh
if ! command -v gcv &>/dev/null; then
  echo "gcv not installed — branch validation skipped"
  echo "Install: npm i -g @hussmarsidi/committy"
  exit 0
fi
gcv branch validate "$1"
`;
}

export function commitMsgScript(): string {
  return `#!/bin/sh
# Reserved for future commit-msg validation
exit 0
`;
}

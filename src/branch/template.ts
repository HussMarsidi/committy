const PLACEHOLDER_RE = /\{([^}]+)\}/g;

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function placeholderRegex(name: string, types: string[]): string {
  switch (name) {
    case "type":
      return `(${types.map(escapeRegexLiteral).join("|")})`;
    case "ticket":
      return "[A-Z]+-[0-9]+";
    case "description":
      return "[a-z0-9]+(?:-[a-z0-9]+)*";
    default:
      return "[a-z0-9-]+";
  }
}

export function extractSegments(pattern: string): string[] {
  const segments: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_RE.source, "g");
  while ((match = re.exec(pattern)) !== null) {
    segments.push(match[1]);
  }
  return segments;
}

export function compilePattern(pattern: string, types: string[]): RegExp {
  let regexStr = "^";
  let lastIndex = 0;
  const re = new RegExp(PLACEHOLDER_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(pattern)) !== null) {
    regexStr += escapeRegexLiteral(pattern.slice(lastIndex, match.index));
    regexStr += placeholderRegex(match[1], types);
    lastIndex = match.index + match[0].length;
  }

  regexStr += escapeRegexLiteral(pattern.slice(lastIndex));
  regexStr += "$";
  return new RegExp(regexStr);
}

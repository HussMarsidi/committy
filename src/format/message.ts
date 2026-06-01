export type CommitParts = {
  type: string;
  scope?: string;
  message: string;
  teamPrefix?: string;
};

export function formatCommitMessage(parts: CommitParts): string {
  const { type, scope, message, teamPrefix } = parts;
  const header = scope ? `${type}(${scope})` : type;
  const body = teamPrefix ? `${teamPrefix} ${message}` : message;
  return `${header}: ${body}`;
}

import type { ConfigIndexes } from "./config/types.js";

export function isValidType(type: string, indexes: ConfigIndexes, hasConfig: boolean): boolean {
  if (!hasConfig) {
    return true;
  }
  return indexes.typeSet.has(type);
}

export function isValidScope(scope: string, indexes: ConfigIndexes, hasConfig: boolean): boolean {
  if (!hasConfig) {
    return true;
  }
  return indexes.scopeSet.has(scope);
}

export function getTeamPrefix(
  scope: string | undefined,
  scopeTeamMap: Map<string, string>,
): string | undefined {
  if (!scope) {
    return undefined;
  }
  return scopeTeamMap.get(scope);
}

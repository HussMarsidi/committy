import type { ConfigIndexes, GcConfig } from "./types.js";

export function buildConfigIndexes(config: GcConfig): ConfigIndexes {
  const typeSet = new Set(config.types);
  const scopeSet = new Set<string>();
  const scopeTeamMap = new Map<string, string>();

  for (const scope of config.scopes) {
    scopeSet.add(scope.name);
    if (scope.team) {
      scopeTeamMap.set(scope.name, scope.team);
    }
  }

  return { typeSet, scopeSet, scopeTeamMap };
}

export function emptyConfigIndexes(): ConfigIndexes {
  return {
    typeSet: new Set(),
    scopeSet: new Set(),
    scopeTeamMap: new Map(),
  };
}

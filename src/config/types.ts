export type GcScope = {
  name: string;
  team?: string;
};

export type GcBranchConfig = {
  allowed: string[];
  types: string[];
};

export type GcConfig = {
  types: string[];
  scopes: GcScope[];
  branches?: GcBranchConfig;
};

export type LoadedConfig = {
  config: GcConfig | null;
  path: string | null;
};

export type ConfigIndexes = {
  typeSet: Set<string>;
  scopeSet: Set<string>;
  scopeTeamMap: Map<string, string>;
};

export class ConfigError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly reason: string,
  ) {
    super(`Invalid config at ${filePath}: ${reason}`);
    this.name = "ConfigError";
  }
}

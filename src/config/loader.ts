import fs from "node:fs";
import path from "node:path";
import { DEFAULT_TYPES } from "./defaults.js";
import { buildConfigIndexes, emptyConfigIndexes } from "./indexes.js";
import { ConfigError, type ConfigIndexes, type GcConfig, type LoadedConfig } from "./types.js";
import { detectRepo } from "../git/repo.js";

const CONFIG_FILENAME = ".gc.json";

export function findConfigPath(cwd: string = process.cwd()): string | null {
  const { repoRoot } = detectRepo(cwd);
  let current = path.resolve(cwd);
  const stopAt = repoRoot ?? path.parse(current).root;

  while (true) {
    const candidate = path.join(current, CONFIG_FILENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    if (current === stopAt) {
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAndValidateConfig(raw: unknown, filePath: string): GcConfig {
  if (!isRecord(raw)) {
    throw new ConfigError(filePath, "root must be a JSON object");
  }

  const { types, scopes } = raw;

  if (!Array.isArray(types) || types.length === 0) {
    throw new ConfigError(filePath, "types must be a non-empty array of strings");
  }

  if (!types.every((t) => typeof t === "string" && t.length > 0)) {
    throw new ConfigError(filePath, "types must be a non-empty array of strings");
  }

  if (!Array.isArray(scopes)) {
    throw new ConfigError(filePath, "scopes must be an array");
  }

  const seenNames = new Set<string>();
  const parsedScopes: GcConfig["scopes"] = [];

  for (const scope of scopes) {
    if (!isRecord(scope) || typeof scope.name !== "string" || scope.name.length === 0) {
      throw new ConfigError(filePath, "each scope must have a non-empty name string");
    }

    if (scope.team !== undefined && typeof scope.team !== "string") {
      throw new ConfigError(filePath, "scope team must be a string when provided");
    }

    if (seenNames.has(scope.name)) {
      throw new ConfigError(filePath, `duplicate scope name "${scope.name}"`);
    }

    seenNames.add(scope.name);
    parsedScopes.push({
      name: scope.name,
      ...(scope.team !== undefined ? { team: scope.team } : {}),
    });
  }

  return {
    types: types as string[],
    scopes: parsedScopes,
  };
}

export function loadConfigFromFile(filePath: string): GcConfig {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    throw new ConfigError(filePath, "unable to read file");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(filePath, "invalid JSON");
  }

  return parseAndValidateConfig(parsed, filePath);
}

export type LoadedConfigResult = {
  loaded: LoadedConfig;
  indexes: ConfigIndexes;
  effectiveTypes: string[];
  effectiveScopes: GcConfig["scopes"];
};

export function loadConfig(cwd: string = process.cwd()): LoadedConfigResult {
  const configPath = findConfigPath(cwd);

  if (!configPath) {
    return {
      loaded: { config: null, path: null },
      indexes: emptyConfigIndexes(),
      effectiveTypes: [...DEFAULT_TYPES],
      effectiveScopes: [],
    };
  }

  const config = loadConfigFromFile(configPath);
  const indexes = buildConfigIndexes(config);

  return {
    loaded: { config, path: configPath },
    indexes,
    effectiveTypes: config.types,
    effectiveScopes: config.scopes,
  };
}

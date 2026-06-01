import type { ConfigIndexes } from "../config/types.js";
import { isValidScope, isValidType } from "../validate.js";
import type { ParsedInline } from "./types.js";

export function parseInlineArgs(
  args: string[],
  indexes: ConfigIndexes,
  hasConfig: boolean,
): ParsedInline {
  if (args.length === 0) {
    return { mode: "partial", partialReason: "missing-message" };
  }

  if (args.length === 1) {
    return {
      message: args[0],
      mode: "partial",
      partialReason: "missing-message",
    };
  }

  let result: ParsedInline;

  if (args.length === 2) {
    const [type, token] = args;
    if (hasConfig && indexes.scopeSet.has(token)) {
      result = {
        type,
        scope: token,
        mode: "partial",
        partialReason: "missing-message",
      };
    } else {
      result = {
        type,
        message: token,
        mode: "complete",
      };
    }
  } else {
    const [type, scope, ...rest] = args;
    result = {
      type,
      scope,
      message: rest.join(" "),
      mode: "complete",
    };
  }

  return validateParsedInline(result, indexes, hasConfig);
}

function validateParsedInline(
  parsed: ParsedInline,
  indexes: ConfigIndexes,
  hasConfig: boolean,
): ParsedInline {
  if (!hasConfig) {
    return parsed;
  }

  if (parsed.type && !isValidType(parsed.type, indexes, hasConfig)) {
    return {
      ...parsed,
      mode: "partial",
      partialReason: "invalid-type",
    };
  }

  if (parsed.scope && !isValidScope(parsed.scope, indexes, hasConfig)) {
    return {
      ...parsed,
      mode: "partial",
      partialReason: "invalid-scope",
    };
  }

  if (parsed.mode === "complete" && !parsed.message?.trim()) {
    return {
      ...parsed,
      mode: "partial",
      partialReason: "missing-message",
    };
  }

  return parsed;
}

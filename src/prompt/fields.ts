import type { ParsedInline } from "../parse/types.js";

export type FieldState<T> = {
  value?: T;
  locked: boolean;
  invalid?: string;
};

export type CommitPromptState = {
  type: FieldState<string>;
  scope: FieldState<string | undefined>;
  message: FieldState<string>;
  focus: "type" | "scope" | "message";
};

export function buildPromptStateFromParsed(
  parsed: ParsedInline,
  hasConfig: boolean,
): CommitPromptState {
  const typeLocked = Boolean(parsed.type) && parsed.partialReason !== "invalid-type";
  const scopeLocked =
    parsed.scope !== undefined && parsed.partialReason !== "invalid-scope";
  const messageLocked = Boolean(parsed.message?.trim()) && parsed.mode === "complete";

  let focus: CommitPromptState["focus"] = "message";
  if (!parsed.type || parsed.partialReason === "invalid-type") {
    focus = "type";
  } else if (parsed.partialReason === "invalid-scope") {
    focus = "scope";
  } else if (!parsed.message?.trim()) {
    focus = "message";
  } else if (!hasConfig && parsed.scope === undefined) {
    focus = "scope";
  }

  return {
    type: {
      value: parsed.type,
      locked: typeLocked,
      invalid: parsed.partialReason === "invalid-type" ? parsed.type : undefined,
    },
    scope: {
      value: parsed.scope,
      locked: scopeLocked,
      invalid: parsed.partialReason === "invalid-scope" ? parsed.scope : undefined,
    },
    message: {
      value: parsed.message,
      locked: messageLocked,
      invalid: undefined,
    },
    focus,
  };
}

export function buildEmptyPromptState(): CommitPromptState {
  return {
    type: { locked: false },
    scope: { locked: false },
    message: { locked: false },
    focus: "type",
  };
}

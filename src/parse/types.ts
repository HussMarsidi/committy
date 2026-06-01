export type PartialReason = "missing-message" | "invalid-type" | "invalid-scope";

export type ParsedInline = {
  type?: string;
  scope?: string;
  message?: string;
  mode: "complete" | "partial";
  partialReason?: PartialReason;
};

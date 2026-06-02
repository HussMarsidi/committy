export type BumpRecommendation = {
  releaseType: "major" | "minor" | "patch";
  reason: string;
};

export async function detectBumpType(): Promise<BumpRecommendation | null> {
  const { Bumper } = await import("conventional-recommended-bump");

  const bumper = new Bumper(process.cwd()).loadPreset("conventionalcommits");
  const rec = await bumper.bump();

  if (!rec.commits || rec.commits.length === 0) {
    return null;
  }

  if (!("releaseType" in rec)) {
    return null;
  }

  return { releaseType: rec.releaseType, reason: rec.reason };
}

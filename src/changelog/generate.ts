export type GenerateOptions = {
  /** Release version for bump; defaults to Unreleased when omitted. Ignored when `init` is true. */
  version?: string;
  from: string | null;
  init: boolean;
};

export async function generateChangelog(options: GenerateOptions): Promise<string> {
  const { ConventionalChangelog } = await import("conventional-changelog");

  const cc = new ConventionalChangelog();
  cc.readPackage();
  await cc.loadPreset("conventionalcommits");

  if (options.init) {
    await cc.options({ releaseCount: 0 });
  } else {
    if (!options.from) {
      await cc.options({ releaseCount: 1 });
    }
    await cc.context({ version: options.version ?? "Unreleased" });
  }

  if (options.from && !options.init) {
    cc.commits({ from: options.from });
  }

  let output = "";
  for await (const chunk of cc.write()) {
    output += chunk;
  }
  return output;
}

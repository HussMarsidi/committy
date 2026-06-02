export type GenerateOptions = {
  /** Release version for prepend/bump; defaults to Unreleased when omitted. Ignored when `all` is true. */
  version?: string;
  from: string | null;
  all: boolean;
};

export async function generateChangelog(options: GenerateOptions): Promise<string> {
  const { ConventionalChangelog } = await import("conventional-changelog");

  const cc = new ConventionalChangelog();
  cc.readPackage();
  await cc.loadPreset("conventionalcommits");

  if (options.all) {
    await cc.options({ releaseCount: 0 });
    await cc.context({ version: "Unreleased" });
  } else {
    await cc.context({ version: options.version ?? "Unreleased" });
  }

  if (options.from && !options.all) {
    cc.commits({ from: options.from });
  }

  let output = "";
  for await (const chunk of cc.write()) {
    output += chunk;
  }
  return output;
}

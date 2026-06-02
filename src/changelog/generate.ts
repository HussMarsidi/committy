export type GenerateOptions = {
  version: string;
  from: string | null;
  all: boolean;
};

export async function generateChangelog(options: GenerateOptions): Promise<string> {
  const { ConventionalChangelog } = await import("conventional-changelog");

  const cc = new ConventionalChangelog();
  await cc.loadPreset("conventionalcommits");
  await cc.context({ version: options.version });

  if (options.all) {
    await cc.options({ releaseCount: 0 });
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

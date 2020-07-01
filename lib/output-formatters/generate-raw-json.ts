import { writeFileSync } from "fs";
import { join } from "path";
import { CrawlConfig, Deprecation } from "../models";
import { ensureDirExists } from "../utils";

export async function generateRawJson(
  config: CrawlConfig,
  rawDeprecations: Deprecation[],
  options: { tagDate: string }
) {
  if (rawDeprecations.length === 0) {
    console.log(
      "🎉 All deprecations are resolved, no raw JSON have to be generated"
    );
    return;
  }

  console.log("📝 Generating raw JSON");

  const content = {
    version: config.gitTag,
    date: options.tagDate,
    deprecations: rawDeprecations,
  };
  const json = JSON.stringify(content, null, 4);

  ensureDirExists(config.outputDirectory);
  writeFileSync(join(config.outputDirectory, `${config.gitTag}.json`), json);
}

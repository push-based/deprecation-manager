import { readFileSync, writeFileSync } from "fs";
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
      "🎉 All deprecations are resolved, no raw JSON has to be generated"
    );
    return;
  }

  console.log("📝 Generating raw JSON");

  ensureDirExists(config.outputDirectory);

  let existingData;
  try {
    const t = readFileSync(join(config.outputDirectory, `${config.gitTag}.json`));
    existingData = JSON.parse(t as any);
  } catch (e) {
    existingData = false;
  }
  let content;
  if (existingData) {
    content = {
      ...existingData,
      deprecations: upsetrDeprecations(existingData.deprecations, rawDeprecations)
    };
  } else {
    content = {
      version: config.gitTag,
      date: options.tagDate,
      deprecations: rawDeprecations
    };
  }

  const json = JSON.stringify(content, null, 4);
  writeFileSync(join(config.outputDirectory, `${config.gitTag}.json`), json);
}

function upsertDeprecations(oldDeprecations: Deprecation[], newDeprecations: Deprecation[]): Deprecation[] {
  const upsertedDeprecations = [...oldDeprecations];
  upsertedDeprecations.forEach(d => upsetrDeprecation(upsertedDeprecations, d));
  return upsertedDeprecations;
}

function upsertDeprecation(oldDeprecations: Deprecation[], deprecation: Deprecation) {
  const i = oldDeprecations.findIndex(_deprecation => deprecation.path+deprecation.lineNumber === _deprecation.path+_deprecation.lineNumber);
  if (i > -1) oldDeprecations[i] = deprecation;
  else oldDeprecations.push(deprecation);
}

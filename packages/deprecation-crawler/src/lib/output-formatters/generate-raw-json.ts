import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CrawlConfig, CrawledRelease, Deprecation } from '../models';
import { ensureDirExists } from '../utils';
import { RAW_DEPRECATION_PATH } from '../constants';
import * as kleur from 'kleur';

export async function generateRawJson(
  config: CrawlConfig,
  crawledRelease: CrawledRelease
): Promise<void> {
  ensureDirExists(config.outputDirectory);

  let existingDeprecations: Deprecation[] = [];
  try {
    const t = readFileSync(
      join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`)
    );
    existingDeprecations = JSON.parse((t as unknown) as string);
  } catch (e) {
    existingDeprecations = [];
  }
  const deprecations = upsertDeprecations(
    existingDeprecations,
    crawledRelease.deprecations
  );

  const json = JSON.stringify(deprecations, null, 4);
  const path = join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`);
  writeFileSync(path, json);

  console.log(kleur.gray(`📝 Raw JSON data up to date under ${path}`));
}

function upsertDeprecations(
  existingDeprecations: Deprecation[],
  newDeprecations: Deprecation[]
): Deprecation[] {
  const upsertedDeprecations = [...existingDeprecations];
  newDeprecations.forEach((newDeprecation) =>
    upsertDeprecation(upsertedDeprecations, newDeprecation)
  );
  return upsertedDeprecations;
}

function upsertDeprecation(
  existingDeprecations: Deprecation[],
  deprecationToUpsert: Deprecation
) {
  const i = existingDeprecations.findIndex(
    (_deprecation) =>
      deprecationToUpsert.path + deprecationToUpsert.lineNumber ===
      _deprecation.path + _deprecation.lineNumber
  );
  if (i > -1) existingDeprecations[i] = deprecationToUpsert;
  else existingDeprecations.push(deprecationToUpsert);
}

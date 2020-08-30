import { CrawlConfig, CrawledRelease, Deprecation } from '../../models';
import {
  ensureDirExists,
  readRawDeprecations,
  writeRawDeprecations,
} from '../../utils';
import * as kleur from 'kleur';

export async function generateRawJson(
  config: CrawlConfig,
  crawledRelease: CrawledRelease
): Promise<void> {
  ensureDirExists(config.outputDirectory);

  const { deprecations: existingDeprecations, path } = readRawDeprecations(
    config
  );

  const deprecations = upsertDeprecations(
    existingDeprecations,
    crawledRelease.deprecations
  );

  writeRawDeprecations(deprecations, config);

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

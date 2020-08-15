import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CrawlConfig, CrawledRelease, Deprecation } from '../models';
import { ensureDirExists } from '../utils';
import { RAW_DEPRECATION_PATH } from '../constants';

export async function generateRawJson(
  config: CrawlConfig,
  crawledRelease: CrawledRelease,
  options: { tagDate: string }
): Promise<void> {
  console.log('📝 Regenerating raw JSON');

  ensureDirExists(config.outputDirectory);

  let existingData;
  try {
    const t = readFileSync(
      join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`)
    );
    existingData = JSON.parse((t as unknown) as string);
  } catch (e) {
    existingData = false;
  }
  let content;
  if (existingData) {
    content = {
      ...existingData,
      deprecations: upsertDeprecations(
        existingData.deprecations,
        crawledRelease.deprecations
      ),
    };
  } else {
    content = {
      version: crawledRelease.tag.name,
      date: options.tagDate,
      deprecations: crawledRelease.deprecations,
    };
  }

  const json = JSON.stringify(content, null, 4);
  const path = join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`);
  writeFileSync(path, json);

  console.log(`📝 Raw JSON data up to date under ${path}`);
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

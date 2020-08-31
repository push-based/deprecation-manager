import {
  CrawlConfig,
  CrawledRelease,
  CrawlerProcess,
  Deprecation,
} from '../models';
import { concat, tap, hash } from '../utils';
import { generateRawJson } from '../output-formatters/json/raw.json.formatter';

/**
 * Generates a RUID for every deprecation
 * Adds the RUID to the depracations of the release
 */
export function addRuid(config: CrawlConfig): CrawlerProcess {
  return concat([
    async (r): Promise<CrawledRelease> => {
      console.log('Adding ruid to deprecations...');
      return {
        ...r,
        deprecations: await generateAndAddRuid(r.deprecations),
      };
    },
    tap((r) => generateRawJson(config, r)),
  ]);
}

export async function generateAndAddRuid(
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  return rawDeprecations.map((deprecation) => {
    return { ...deprecation, ruid: hash(deprecation.code) };
  });
}

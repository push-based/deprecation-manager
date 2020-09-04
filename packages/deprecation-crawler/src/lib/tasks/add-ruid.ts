import {
  CrawlConfig,
  CrawledRelease,
  CrawlerProcess,
  Deprecation,
} from '../models';
import { concat, hash } from '../utils';

/**
 * Generates a RUID for every deprecation
 * Adds the RUID to the depracations of the release
 */
export function addRuid(_config: CrawlConfig): CrawlerProcess {
  return concat([
    async (r): Promise<CrawledRelease> => {
      return {
        ...r,
        deprecations: await generateAndAddRuid(r.deprecations),
      };
    },
  ]);
}

export async function generateAndAddRuid(
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  return rawDeprecations.map((deprecation) => {
    return { ...deprecation, ruid: hash(deprecation.code) };
  });
}

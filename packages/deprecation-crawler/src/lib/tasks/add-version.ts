import {
  CrawlConfig,
  CrawledRelease,
  CrawlerProcess,
  Deprecation,
} from '../models';
import {
  concat,
  readRawDeprecations,
  tap,
  writeRawDeprecations,
} from '../utils';

/**
 * Adds the version to the (existing and new) deprecations
 */
export function addVersion(config: CrawlConfig): CrawlerProcess {
  return async function (release) {
    if (!release.version) return release;

    return concat([
      async (r): Promise<CrawledRelease> => {
        return {
          ...r,
          deprecations: updateVersion(r.deprecations, r.version),
        };
      },
      tap(async (r) => updateExistingDeprecations(config, r.version)),
    ])(release);
  };
}

function updateVersion(
  rawDeprecations: Deprecation[],
  version: string
): Deprecation[] {
  return rawDeprecations.map((deprecation) => {
    return { ...deprecation, version: version };
  });
}

function updateExistingDeprecations(config: CrawlConfig, version: string) {
  const { deprecations } = readRawDeprecations(config);
  const deprecationsWithVersion = updateVersion(deprecations, version);
  writeRawDeprecations(deprecationsWithVersion, config);
}

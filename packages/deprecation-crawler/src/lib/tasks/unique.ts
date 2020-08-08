import { CrawlConfig, Deprecation } from '../models';
import { hash } from '../utils';

export async function addUniqueKey(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<Deprecation[]> {
  if (rawDeprecations.length === 0) {
    return rawDeprecations;
  }

  console.log('Adding ruid to deprecations...');
  return rawDeprecations.map((deprecation) => {
    return { ...deprecation, ruid: hash(deprecation.code) };
  });
}

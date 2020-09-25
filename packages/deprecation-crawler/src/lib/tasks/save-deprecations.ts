import { CrawlConfig, CrawlerProcess } from '../models';
import { generateRawJson } from '../output-formatters/json/raw.json.formatter';
import { concat, tap } from '../utils';

/**
 * Update the raw deprecations with the newly crawled deprecations
 */
export function saveDeprecations(config: CrawlConfig): CrawlerProcess {
  return async function (release) {
    return concat([tap((r) => generateRawJson(config, r))])(release);
  };
}

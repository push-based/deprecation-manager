import { CrawlConfig, CrawlerProcess, CrawledRelease } from '../models';
import { concat } from '../utils';
import { crawlDeprecations } from '../crawler';
import { addRuid } from '../processors/add-ruid';

/**
 * Look for deprecations
 * Adds the deprecations to the release
 */
export function crawl(config: CrawlConfig): CrawlerProcess {
  return concat([
    async (r): Promise<CrawledRelease> => {
      const deprecations = await crawlDeprecations(config, r.remoteUrl, r.date);
      return {
        ...r,
        deprecations,
      };
    },
    addRuid(config),
  ]);
}

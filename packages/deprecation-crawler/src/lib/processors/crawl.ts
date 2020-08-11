import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { concat, tap } from '../utils';
import { generateRawJson } from '../output-formatters';
import { addUniqueKey } from '../tasks/unique';
import { crawlDeprecations } from '../crawler';
import { checkout } from '../checkout';

export function crawl(
  config: CrawlConfig
): CrawlerProcess<CrawledRelease, CrawledRelease> {
  return concat([
    async (crawledRelease: CrawledRelease): Promise<CrawledRelease> => ({
      version: config.gitTag,
      date: await checkout(config),
      ...crawledRelease,
      deprecations: await crawlDeprecations(config).then((deprecations) =>
        addUniqueKey(config, deprecations)
      ),
    }),
    tap((r: CrawledRelease) =>
      generateRawJson(config, r.deprecations, { tagDate: r.date })
    ),
  ]);
}

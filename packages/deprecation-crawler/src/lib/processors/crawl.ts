import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { concat, tap } from '../utils';
import { generateRawJson } from '../output-formatters';
import { addUniqueKey } from '../tasks/unique';

export function crawl(config: CrawlConfig): CrawlerProcess {
  return concat([
    async (r): Promise<CrawledRelease> => ({
      ...r,
      deprecations: await addUniqueKey(config, r.deprecations),
    }),
    tap((r) => generateRawJson(config, r.deprecations, { tagDate: r.date })),
  ]);
}

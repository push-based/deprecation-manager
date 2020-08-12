import { concat, tap } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { ensureFormatter } from '../tasks/ensure-fotmatters';

// Formatting Job
export function format(
  config: CrawlConfig
): CrawlerProcess<CrawledRelease, CrawledRelease> {
  return concat(
    ensureFormatter(config).map((formatter) =>
      tap((r: CrawledRelease) => formatter(config, r.deprecations))
    )
  );
}

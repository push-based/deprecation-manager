import { concat, tap } from '../utils';
import { CrawledRelease, CrawlerProcess } from '../models';
import { ensureFormatter } from '../tasks/ensure-fotmatters';

// Formatting Job
export function format(config): CrawlerProcess {
  return concat(
    ensureFormatter(config).map(([_, formatter]) =>
      tap((r: CrawledRelease) => formatter(config, r.deprecations))
    )
  );
}

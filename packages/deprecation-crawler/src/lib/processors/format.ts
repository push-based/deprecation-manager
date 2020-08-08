import { concat, tap } from "../utils";
import { CrawledRelease, CrawlerProcess } from "../models";
import { ensureFormatter } from "../tasks/ensure-fotmatters";

// Formatting Job
export function format(config): CrawlerProcess<CrawledRelease, CrawledRelease> {
  return concat(
    ensureFormatter(config)
      .map(([formatterKey, formatter]) =>
        tap((r: CrawledRelease) => formatter(config, r.deprecations)))
  )
}

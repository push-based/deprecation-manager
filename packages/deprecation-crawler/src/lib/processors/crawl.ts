import { CrawlConfig, CrawledRelease, CrawlerProcess } from "../models";
import { concat, tap } from "../utils";
import { generateRawJson } from "../output-formatters";
import { addUniqueKey } from "../tasks/unique";

export function crawl(config: CrawlConfig): CrawlerProcess<CrawledRelease, CrawledRelease> {
  return concat([
    async (crawledRelease: CrawledRelease): Promise<CrawledRelease> => ({
      ...crawledRelease,
      deprecations: await addUniqueKey(config, crawledRelease.deprecations)
    }),
    tap((r: CrawledRelease) =>
      generateRawJson(config, r.deprecations, { tagDate: r.date })
    )
  ])
}

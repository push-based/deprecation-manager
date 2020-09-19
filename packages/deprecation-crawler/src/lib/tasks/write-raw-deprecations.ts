import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { writeRawDeprecations } from '../utils';

export function writeRawDeprecationsTask(config: CrawlConfig): CrawlerProcess {
  return async (r: CrawledRelease): Promise<void> => {
    await writeRawDeprecations(r.deprecations, config);
  };
}

import { CrawlConfig, CrawlerProcess } from '../models';
import { askToSkip } from '../utils';
import { format } from '../processors/format';

/**
 * Generates the formatted output files
 */
export function generateOutput(config: CrawlConfig): CrawlerProcess {
  return askToSkip('Update Formatted Output?', format(config), {
    precondition: async (r) => r.deprecations?.length > 0,
  });
}

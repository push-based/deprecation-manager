import { CrawlConfig, CrawlerProcess } from '../models';
import { askToSkip } from '../utils';
import { group } from '../processors/grouping';

/**
 * Ask for a group for each found deprecation
 * Adds a group to the deprecations of the release
 */
export function addGroups(config: CrawlConfig): CrawlerProcess {
  return askToSkip('Grouping?', group(config), {
    precondition: async (r) => r.deprecations?.some((d) => !d.group),
  });
}

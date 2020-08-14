import { CrawlConfig, CrawlerProcess } from '../models';
import { tap, askToSkip } from '../utils';
import { addCommentToRepository } from '../output-formatters';

/**
 * Updates the target repository
 * Adds the RUID to to the deprecation messages in the codebase
 */
export function updateRepository(config: CrawlConfig): CrawlerProcess {
  return askToSkip(
    'Repo Update?',
    tap((r) => addCommentToRepository(config, r.deprecations)),
    {
      precondition: async (r) => r.deprecations?.length > 0,
    }
  );
}

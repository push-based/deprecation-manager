import { CrawlConfig, CrawlerProcess } from '../models';
import { tap } from '../utils';
import { generateTaggedCommentsInRepository } from '../output-formatters/git/tag-comments.git.formatter';

/**
 * Updates the target repository
 * Adds the RUID to to the deprecation messages in the codebase
 */
export function updateRepository(config: CrawlConfig): CrawlerProcess {
  return tap((r) => generateTaggedCommentsInRepository(config, r));
}

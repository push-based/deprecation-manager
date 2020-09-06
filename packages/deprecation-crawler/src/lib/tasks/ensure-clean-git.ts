/**
 * Adds the version to the (existing and new) deprecations
 */
import { git, tap } from '../utils';
import { CrawlerProcess } from '../models';

export function ensureCleanGit(): CrawlerProcess {
  return tap(async () => {
    return git.stash().then(() => Promise.resolve());
  });
}

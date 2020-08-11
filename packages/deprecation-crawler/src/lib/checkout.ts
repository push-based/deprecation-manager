import { CrawlConfig } from './models';
import { git, sandBoxMode } from './utils';

export async function checkout(config: CrawlConfig): Promise<string> {
  if (sandBoxMode()) {
    return 'sandbox-date';
  }

  const currentBranch = await git([`branch --show-current`]).then((v) =>
    v.trim()
  );
  if (currentBranch !== config.gitTag) {
    await git([`checkout`, config.gitTag]);
  }
  const date = await git([`log -1 --format=%ai ${config.gitTag}`]);
  return date.replace('\r\n', '').replace('\n', '');
}

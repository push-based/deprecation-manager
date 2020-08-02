import { CrawlConfig } from './models';
import { git, sandBoxMode } from './utils';

export async function checkout(config: CrawlConfig) {
  if (sandBoxMode()) {
    return 'sandbox-date';
  }
  await git([`checkout`, config.gitTag]);
  const date = await git([`log -1 --format=%ai ${config.gitTag}`]);
  return date.replace('\r\n', '').replace('\n', '');
}

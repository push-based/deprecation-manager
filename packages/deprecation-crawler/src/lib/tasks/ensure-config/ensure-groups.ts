import { CrawlConfig } from '../../models';
import { getDefaultGroups } from './ensure-config-defaults';
import { ensureDeprecationComment } from './ensure-deprecation-comment';

export async function ensureGroups(config: CrawlConfig): Promise<CrawlConfig> {
  if (!config.deprecationComment) {
    config = {
      ...config,
      ...(await ensureDeprecationComment(config)),
    };
  }

  return await {
    ...config,
    groups:
      (config.groups || []).length <= 0
        ? await getDefaultGroups(config.deprecationComment)
        : config.groups,
  };
}

import { CrawlConfig } from '../models';
import { DEFAULT_COMMIT_MESSAGE, TAG_FORMAT_TEMPLATE } from '../constants';

export async function ensureConfigDefaults(
  userConfig: CrawlConfig
): Promise<CrawlConfig> {
  return await {
    outputFormatters: ['tagBasedMarkdown', 'groupBasedMarkdown'],
    tagFormat: TAG_FORMAT_TEMPLATE,
    commitMessage: DEFAULT_COMMIT_MESSAGE,
    groups: [
      { key: 'ungrouped', matchers: [] },
      {
        key: 'health-check',
        matchers: ['\\/\\*\\* *\\' + userConfig.deprecationComment + ' *\\*/'],
      },
    ],
    // override defaults with user settings
    ...userConfig,
  };
}

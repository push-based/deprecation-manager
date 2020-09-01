import { CrawlConfig } from '../models';
import {
  DEFAULT_COMMENT_LINK_TEMPLATE,
  DEFAULT_COMMIT_MESSAGE,
  HEALTH_CHECK_GROUP_NAME,
  TAG_FORMAT_TEMPLATE,
  UNGROUPED_GROUP_NAME,
} from '../constants';

export async function ensureConfigDefaults(
  userConfig: CrawlConfig
): Promise<CrawlConfig> {
  return await {
    outputFormatters: [
      'tagBasedMarkdown',
      'groupBasedMarkdown',
      'deprecationIndex',
    ],
    pathFilter: '',
    tagFormat: TAG_FORMAT_TEMPLATE,
    commitMessage: DEFAULT_COMMIT_MESSAGE,
    commentLinkFormat: DEFAULT_COMMENT_LINK_TEMPLATE,
    groups: [
      { key: UNGROUPED_GROUP_NAME, matchers: [] },
      {
        key: HEALTH_CHECK_GROUP_NAME,
        matchers: ['\\/\\*\\* *\\' + userConfig.deprecationComment + ' *\\*/'],
      },
    ],
    // override defaults with user settings
    ...userConfig,
  };
}

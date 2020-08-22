import { CrawlConfig } from '../models';
import {
  COMMENT_LINK_URL_PARAM_TOKEN,
  COMMENT_LINK_URL_TOKEN,
} from '../constants';

export function ensureTagFormat(config: CrawlConfig): void {
  if (!config.commentLinkFormat) {
    throw new Error(
      `Comment link template ${config.deprecationComment} invalid check your settings in ${config.configPath}`
    );
  }
  if (
    !config.commentLinkFormat.includes(COMMENT_LINK_URL_TOKEN) ||
    !config.commentLinkFormat.includes(COMMENT_LINK_URL_PARAM_TOKEN)
  ) {
    throw new Error(
      `Comment link template ${config.commentLinkFormat} has to include ${COMMENT_LINK_URL_TOKEN} and ${COMMENT_LINK_URL_PARAM_TOKEN} as token`
    );
  }
}

import { CrawlConfig } from '../../models';
import { COMMENT_LINK_URL_PARAM_TOKEN, COMMENT_LINK_URL_TOKEN, DEFAULT_COMMENT_LINK_TEMPLATE } from '../../constants';
import { getConfigPath } from '../../utils';

export async function ensureCommentLinkFormat(config: CrawlConfig): Promise<CrawlConfig> {
  const commentLinkFormatSuggestion = config.commentLinkFormat || DEFAULT_COMMENT_LINK_TEMPLATE;

  if (!commentLinkFormatSuggestion) {
    throw new Error(
      `Comment link template ${
        commentLinkFormatSuggestion
      } invalid check your settings in ${getConfigPath()}`
    );
  }
  if (
    !commentLinkFormatSuggestion.includes(COMMENT_LINK_URL_TOKEN) ||
    !commentLinkFormatSuggestion.includes(COMMENT_LINK_URL_PARAM_TOKEN)
  ) {
    throw new Error(
      `Comment link template ${commentLinkFormatSuggestion} has to include ${COMMENT_LINK_URL_TOKEN} and ${COMMENT_LINK_URL_PARAM_TOKEN} as token`
    );
  }

  return await {
    ...config,
    commentLinkFormat: commentLinkFormatSuggestion
  };
}

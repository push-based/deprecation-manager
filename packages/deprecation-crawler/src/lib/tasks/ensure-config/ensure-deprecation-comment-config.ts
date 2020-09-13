import { prompt } from 'enquirer';
import { CrawlConfig } from '../../models';
import { DEFAULT_DEPRECATION_MSG_TOKEN } from '../../constants';
import { getInteractive } from '../../utils';

export async function ensureDeprecationCommentConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  let deprecationCommentSuggestion = config.deprecationComment || DEFAULT_DEPRECATION_MSG_TOKEN;
  if (getInteractive()) {
    const { deprecationComment } = await prompt([
      {
        type: 'input',
        name: 'deprecationComment',
        message: 'What\'s the deprecation keyword to look for?',
        initial: deprecationCommentSuggestion,
        skip: !!config.deprecationComment
      }
    ]);
    deprecationCommentSuggestion = deprecationComment;
  }

  return {
    ...config,
    deprecationComment: deprecationCommentSuggestion
  };
}

import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';
import { DEFAULT_DEPRECATION_MSG_TOKEN } from '../constants';

export async function ensureDeprecationCommentConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'deprecationComment',
      message: "What's the deprecation keyword to look for?",
      initial: config.deprecationComment || DEFAULT_DEPRECATION_MSG_TOKEN,
      skip: !!config.deprecationComment,
    },
  ]);

  return {
    ...config,
    ...userConfig,
  };
}

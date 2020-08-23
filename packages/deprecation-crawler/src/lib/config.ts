
import { normalize } from 'path';
import { prompt } from 'enquirer';
import { glob } from 'glob';
import { CrawlConfig, CrawlConfigDefaults } from './models';
import {
  CRAWLER_CONFIG_PATH,
  TSCONFIG_PATH,
  DEPRECATIONS_OUTPUT_DIRECTORY,
  DEFAULT_COMMIT_MESSAGE,
  DEFAULT_DEPRECATION_MSG_TOKEN,
  TAG_FORMAT_TEMPLATE,
  DEFAULT_COMMENT_LINK_TEMPLATE,
} from './constants';
import { getCliParam, readFile, updateRepoConfig } from './utils';
import { readRepoConfig, updateRepoConfig } from './utils';
import { ensureDeprecationCommentConfig } from './tasks/ensure-deprecation-comment-config';
import { ensureTsConfigPath } from './tasks/ensure-tsconfig-path';
import { ensureDeprecationUrlConfig } from './tasks/ensure-deprecations-url-config';
import { ensureOutputDirectoryConfig } from './tasks/ensure-output-directory-config';
import { ensureConfigDefaults } from './tasks/ensure-config-defaults';

export async function getConfig(): Promise<CrawlConfig> {
  const repoConfig = readRepoConfig();

  const config = {
    ...repoConfig,
    ...userConfig,
    ...(await ensureTsConfigPath(repoConfig)
      .then(ensureDeprecationUrlConfig)
      .then(ensureDeprecationCommentConfig)
      .then(ensureOutputDirectoryConfig)
      // defaults should be last as it takes user settings
      .then(ensureConfigDefaults)),
  };

  updateRepoConfig(config);
  return config;
}

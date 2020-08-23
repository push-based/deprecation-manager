import { CrawlConfig } from './models';
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

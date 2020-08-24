import { CrawlConfig } from './models';
import {
  getConfigPath,
  getVerboseFlag,
  readRepoConfig,
  updateRepoConfig,
} from './utils';
import { ensureDeprecationCommentConfig } from './tasks/ensure-deprecation-comment-config';
import { ensureTsConfigPath } from './tasks/ensure-tsconfig-path';
import { ensureDeprecationUrlConfig } from './tasks/ensure-deprecations-url-config';
import { ensureOutputDirectoryConfig } from './tasks/ensure-output-directory-config';
import { ensureConfigDefaults } from './tasks/ensure-config-defaults';
import { printHeadline, ProcessFeedback } from './log';
import * as kleur from 'kleur';

const feedback = getSetupFeedback();
export async function getConfig(): Promise<CrawlConfig> {
  const repoConfig = readRepoConfig();
  const isFirstRun = Object.keys(repoConfig).length <= 0;
  if (isFirstRun || getVerboseFlag()) {
    feedback.printInitialStart();
  } else {
    feedback.printStart(repoConfig);
  }

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
  if (isFirstRun || getVerboseFlag()) {
    feedback.printInitialEnd(config);
  }
  return config;
}

function getSetupFeedback(): ProcessFeedback & {
  printInitialStart(): void;
  printInitialEnd(config: CrawlConfig): void;
} {
  return {
    printInitialStart: (): void => {
      printHeadline('SETUP PHASE');
      console.log(kleur.gray(`🌱 Start setting up ${getConfigPath()}`));
      console.log('');
    },

    printStart(): void {
      console.log(kleur.gray(`Using configuration: ${getConfigPath()}`));
    },

    printInitialEnd(config: CrawlConfig): void {
      console.log(
        kleur.green(`✓ `),
        kleur.gray(`Repository configured for deprecation management is done!`)
      );
      console.log(kleur.gray(`Configuration saved under: ${getConfigPath()}`));
      console.log(kleur.gray(JSON.stringify(config, null, 4)));
      console.log(
        kleur.gray(`From now on the crawler will go to ${getConfigPath()} and crawl files referenced under ${
          config.tsConfigPath
        } and these questions will not get asked next time.
                   If you want to change something edit the content of ${getConfigPath()} or ${
          config.tsConfigPath
        } or create a custom tsconfig file.`)
      );
    },
  };
}

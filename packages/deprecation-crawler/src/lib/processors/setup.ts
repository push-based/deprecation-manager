import { CrawlConfig } from '../models';
import {
  getConfigPath,
  getVerboseFlag,
  readRepoConfig,
  updateRepoConfig,
} from '../utils';
import { printHeadline, ProcessFeedback } from '../log';
import * as kleur from 'kleur';
import * as cfgQuestions from '../tasks/ensure-config';

const feedback = getSetupFeedback();
export async function setup(): Promise<CrawlConfig> {
  const repoConfig = readRepoConfig();
  const isFirstRun = Object.keys(repoConfig).length <= 0;
  if (isFirstRun || getVerboseFlag()) {
    feedback.printInitialStart();
  } else {
    feedback.printStart(repoConfig);
  }

  const config = {
    ...repoConfig,
    ...(await cfgQuestions
      .ensureDeprecationUrl(repoConfig)
      .then(cfgQuestions.ensureDeprecationComment)
      .then(cfgQuestions.ensureGroups)
      .then(cfgQuestions.ensureFormatter)
      .then(cfgQuestions.ensureOutputDirectory)
      .then(cfgQuestions.ensureIncludeGlob)
      .then(cfgQuestions.ensureExcludeGlob)
      // defaults should be last as it takes user settings
      .then(cfgQuestions.ensureConfigDefaults)),
  };

  // NOTICE: this is needed for better git flow.
  // Touch a file only if needed
  if (JSON.stringify(repoConfig) !== JSON.stringify(config)) {
    updateRepoConfig(config);
  }
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
    },
  };
}

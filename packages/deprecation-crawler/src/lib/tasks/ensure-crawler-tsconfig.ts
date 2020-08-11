import { CrawlConfig } from '../models';
import { prompt } from 'enquirer';
import { normalize } from 'path';
import { SKIP_PROMPT_SELECTION_CHOICE } from '../constants';
import { fileExists } from '@nrwl/workspace/src/utils/fileutils';
import { sandBoxMode, updateRepoConfig } from '../utils';
import { glob } from 'glob';

export async function ensureTsConfigPath(
  config: CrawlConfig
): Promise<CrawlConfig> {
  // If a tsconfig files is already set proceed
  if (fileExists(config.tsConfigPath)) {
    console.log(`Crawling with tsconfig: ${config.tsConfigPath}`);
    return config;
  }

  if (sandBoxMode()) {
    throw new Error(`${config.tsConfigPath} does not exist.`);
  }

  // Ensure any tsconfig files present to select
  const tsConfigFiles: string[] = [
    SKIP_PROMPT_SELECTION_CHOICE,
    ...findTsConfigFiles(),
  ];
  if (tsConfigFiles.length === 0) {
    throw Error(
      'No tsconfig.ts files present in the current folder structure.'
    );
  }

  const tsConfigPathAnswer: { tsConfigPath: string } = await prompt([
    {
      type: 'select',
      name: 'tsConfigPath',
      message: "What's the location of the base ts config file to extend from?",
      choices: tsConfigFiles,
      format(value) {
        return value ? normalize(value) : '';
      },
      initial: tsConfigFiles[0] as any,
      skip: tsConfigFiles.length === 1,
    },
  ]);

  // Update repoConfig with selected tsconfig file
  const newConfig = {
    ...config,
    tsConfigPath: tsConfigPathAnswer.tsConfigPath,
  };
  updateRepoConfig(newConfig);
  return newConfig;
}

export function findTsConfigFiles(): string[] {
  return glob.sync('**/*tsconfig*.json', {
    ignore: '**/node_modules/**',
  });
}

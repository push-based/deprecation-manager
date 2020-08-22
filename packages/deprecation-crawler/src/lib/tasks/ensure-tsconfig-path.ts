import { CrawlConfig } from '../models';
import { prompt } from 'enquirer';
import { normalize } from 'path';
import { getConfigPath, updateRepoConfig } from '../utils';
import { glob } from 'glob';
import { CRAWLER_MODES } from '../constants';
import * as fs from 'fs';
import { existsSync } from 'fs';

export async function ensureTsConfigPath(
  config: CrawlConfig
): Promise<CrawlConfig> {
  // If a tsconfig files is already set proceed
  if (fileExists(config.tsConfigPath)) {
    console.log(`Running with tsconfig: ${config.tsConfigPath}`);
    return config;
  }

  if (process.env.__CRAWLER_MODE__ === CRAWLER_MODES.SANDBOX) {
    throw new Error(`${config.tsConfigPath} does not exist.`);
  }

  // Ensure any tsconfig files present to select
  const tsConfigFiles: string[] = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error(
      'No tsconfig.json files present in the current folder structure.'
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

  if (existsSync(config.tsConfigPath)) {
    throw Error(
      `Config file ${
        config.tsConfigPath
      } does not exist. Please update your tsConfigPath setting in ${getConfigPath()}`
    );
  }

  return newConfig;
}

export function findTsConfigFiles(): string[] {
  return glob.sync('**/*tsconfig*.json', {
    ignore: '**/node_modules/**',
  });
}

function fileExists(path: string) {
  try {
    if (fs.existsSync(path)) {
      return true;
    }
  } catch (err) {
    return false;
  }
}

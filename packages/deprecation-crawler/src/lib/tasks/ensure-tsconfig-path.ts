import { CrawlConfig } from '../models';
import { prompt } from 'enquirer';
import { normalize } from 'path';
import { getConfigPath, getVerboseFlag, updateRepoConfig } from '../utils';
import { glob } from 'glob';
import { CRAWLER_MODES } from '../constants';
import * as fs from 'fs';
import { existsSync } from 'fs';
import * as kleur from 'kleur';

export async function ensureTsConfigPath(
  config: CrawlConfig
): Promise<CrawlConfig> {
  // If a tsconfig files is already set proceed
  if (fileExists(config.tsConfigPath)) {
    if (getVerboseFlag()) {
      console.log(kleur.gray(`Running with tsconfig: ${config.tsConfigPath}`));
    }
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

  const newConfig = { ...config };

  const { tsConfigPath }: { tsConfigPath: string } = await prompt([
    {
      type: 'select',
      name: 'tsConfigPath',
      message: 'What tsconfig file do you want to use?',
      choices: tsConfigFiles,
      format(value) {
        return value ? normalize(value) : '';
      },
      initial:
        ((config.tsConfigPath as unknown) as number) ||
        ((tsConfigFiles[0] as unknown) as number),
      skip: tsConfigFiles.length === 1 || !!config.tsConfigPath,
    },
  ]);

  newConfig.tsConfigPath = tsConfigPath;

  if (!existsSync(newConfig.tsConfigPath)) {
    if (process.env.__CRAWLER_MODE__ === CRAWLER_MODES.SANDBOX) {
      throw Error(
        `Config file ${
          config.tsConfigPath
        } does not exist. Please update your tsConfigPath setting in ${getConfigPath()}`
      );
    }

    const { tsConfigPath } = await prompt([
      {
        type: 'select',
        name: 'tsConfigPath',
        message: `tsconfig "${config.tsConfigPath}" does not exist, let's try again.`,
        choices: findTsConfigFiles(),
        format(value) {
          return value ? normalize(value) : '';
        },
      },
    ]);

    newConfig.tsConfigPath = tsConfigPath;
  }

  // Update repoConfig with selected tsconfig file
  updateRepoConfig(newConfig);

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

import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';
import { glob } from 'glob';

export async function ensureIncludeGlobConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const includePresent =
    Array.isArray(config.include) && config.include.length > 0;
  const userConfig: { include: string } = await prompt([
    {
      type: 'input',
      name: 'include',
      message: "What's the glob for included files?",
      initial: './**/*.ts',
      skip: includePresent,
    },
  ]);

  const include = includePresent ? config.include : [userConfig.include];

  include.forEach((globPattern: string) => {
    glob(globPattern, null, function (er, files) {
      if (er) {
        throw er;
      }

      if (files.length <= 0) {
        throw new Error(`No files included in glob ${globPattern}`);
      }
    });
  });

  return {
    ...config,
    include,
  };
}

export async function ensureExcludeGlobConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const excludePresent =
    Array.isArray(config.exclude) && config.exclude.length > 0;

  const userConfig: { exclude: string } = await prompt([
    {
      type: 'input',
      name: 'exclude',
      message: "What's the glob for excluded files?",
      initial: './**/*.(spec|test|d).ts',
      skip: excludePresent,
    },
  ]);

  const exclude = excludePresent ? config.exclude : [userConfig.exclude];

  return {
    ...config,
    exclude,
  };
}

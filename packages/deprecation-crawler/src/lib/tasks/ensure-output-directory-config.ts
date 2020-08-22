import { prompt } from 'enquirer';
import { CrawlConfig } from '../models';
import { DEPRECATIONS_OUTPUT_DIRECTORY } from '../constants';

export async function ensureOutputDirectoryConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const userConfig: CrawlConfig = await prompt([
    {
      type: 'input',
      name: 'outputDirectory',
      message: "What's the output directory?",
      initial: config.outputDirectory || DEPRECATIONS_OUTPUT_DIRECTORY,
      skip: !!config.outputDirectory,
    },
  ]);

  return {
    ...config,
    ...userConfig,
  };
}

import { prompt } from 'enquirer';
import { CrawlConfig } from '../../models';
import { getInteractive } from '../../utils';
import { ensureConfigDefaults } from './ensure-config-defaults';
import { DEFAULT_EXCLUDES, DEFAULT_INCLUDES } from '../../constants';


export async function ensureIncludeGlobConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const includePresent =
    Array.isArray(config.include) && config.include.length > 0;
  let includeSuggestion = includePresent ? config.include : DEFAULT_INCLUDES;
  if (getInteractive()) {
    const { include }: { include: string } = await prompt([
      {
        type: 'input',
        name: 'include',
        message: 'What\'s the glob for included files?',
        initial: includeSuggestion.join(' '),
        skip: includePresent
      }
    ]);
    includeSuggestion = include.split(' ');
  }

  return {
    ...config,
    include: includeSuggestion
  };
}

export async function ensureExcludeGlobConfig(
  config: CrawlConfig
): Promise<CrawlConfig> {
  const excludePresent =
    Array.isArray(config.exclude) && config.exclude.length > 0;
  let excludeSuggestion = excludePresent ? config.exclude : DEFAULT_EXCLUDES;
  if (getInteractive()) {
    const { exclude }: { exclude: string } = await prompt([
      {
        type: 'input',
        name: 'exclude',
        message: 'What\'s the glob for excluded files?',
        initial: excludeSuggestion.join(' '),
        skip: excludePresent
      }
    ]);
    excludeSuggestion = exclude.split(' ');
  }

  return {
    ...config,
    exclude: excludeSuggestion
  };
}

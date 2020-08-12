import { EOL } from 'os';
import { builtInFormatter } from '../output-formatters';
import { CRAWLER_CONFIG_PATH } from '../constants';
import { CrawlConfig, Deprecation } from '../models';

interface Formatter {
  (config: CrawlConfig, rawDeprecations: Deprecation[]): Promise<void>;
}

export function ensureFormatter(config: CrawlConfig): Formatter[] {
  if (config.outputFormatters.length <= 0) {
    throw new Error(`No formatter registered! ${EOL}
    builtInFormatter: ${Object.keys(builtInFormatter).join(', ')}${EOL}
    Add outputFormatters to ${CRAWLER_CONFIG_PATH}.`);
  }

  const configuredAndExistingFormatter = Object.entries(builtInFormatter)
    // Run only registered formatters
    .filter(([formatterKey, _]: [string, Formatter]) =>
      config.outputFormatters.includes(formatterKey)
    );

  if (configuredAndExistingFormatter.length <= 0) {
    throw new Error(`No registered formatter available! ${EOL}
    registered formatter: ${Object.keys(config.outputFormatters).join(
      ', '
    )}${EOL}
    Update outputFormatters to ${CRAWLER_CONFIG_PATH} with existing formatters.`);
  }

  const wrongFormatter = configuredAndExistingFormatter
    .filter(([key]) => !Object.keys(builtInFormatter).includes(key))
    .map(([k]) => k);
  if (wrongFormatter.length > 0) {
    throw new Error(`Wrong formatter registered! ${EOL}
    Following formatter are not available: ${Object.keys(wrongFormatter).join(
      ', '
    )}${EOL}
    Update outputFormatters to ${CRAWLER_CONFIG_PATH} with correct formatters.`);
  }

  return configuredAndExistingFormatter.map(
    ([_, formatter]: [any, Formatter]) => formatter
  );
}

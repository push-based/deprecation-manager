import { concat, tap } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import {
  printFooterLine,
  printHeadline,
  printProgress,
  ProcessFeedback,
} from '../log';
import * as kleur from 'kleur';
import { builtInFormatter } from '../output-formatters';

const feedback = getFormatFeedback();

// Formatting Job
export function format(config: CrawlConfig): CrawlerProcess {
  return concat([
    tap(async (r: CrawledRelease) => feedback.printStart(config, r)),
    ...Object.entries(builtInFormatter)
      .filter(([key]) => config.outputFormatters.includes(key))
      .map(([_, formatter]) =>
        tap(async (r: CrawledRelease) => formatter(config, r))
      ),
    tap(async (r: CrawledRelease) => feedback.printEnd(config, r)),
  ]);
}

function getFormatFeedback(): ProcessFeedback {
  return {
    printStart(): void {
      printHeadline('FORMAT OUTPUT');
      console.log(kleur.gray(`✍️ Start updating the markdown output.`));
      printProgress();
    },

    printEnd(config: CrawlConfig, rawRelease: CrawledRelease): void {
      console.log(kleur.green('✓ '), kleur.gray(`All formats updated!`));
      console.log(
        [
          kleur.gray(`Updated`),
          kleur.gray(`formats:`),
          kleur.gray(config.outputFormatters.join(',')),
          kleur.gray(`for`),
          kleur.black(rawRelease.deprecations.length),
          kleur.gray(`deprecations`),
        ].join(' ')
      );
      printFooterLine();
    },
  };
}

import { concat, tap } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { ensureFormatter } from '../tasks/ensure-fotmatters';
import {
  printFooterLine,
  printHeadline,
  printProgress,
  ProcessFeedback,
} from '../log';
import * as kleur from 'kleur';

const feedback = getFormatFeedback();
// Formatting Job
export function format(config): CrawlerProcess {
  return concat([
    tap(async (r) => feedback.printStart(config, r)),
    ...ensureFormatter(config).map(([_, formatter]) =>
      tap((r: CrawledRelease) => formatter(config, r))
    ),
    tap(async (r) => feedback.printEnd(config, r)),
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

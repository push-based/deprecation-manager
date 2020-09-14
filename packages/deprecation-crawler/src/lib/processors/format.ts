import { concat, tap } from '../utils';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { printFooterLine, printHeadline, printProgress, ProcessFeedback } from '../log';
import * as kleur from 'kleur';

const feedback = getFormatFeedback();

// Formatting Job
export function format(cfg): CrawlerProcess {
  return concat([
    tap(async (r: CrawledRelease) => feedback.printStart(cfg, r)),
    ...cfg.map(formatter => tap(async (r: CrawledRelease) => formatter(cfg, r))),
    tap(async (r: CrawledRelease) => feedback.printEnd(cfg, r))
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
          kleur.gray(`deprecations`)
        ].join(' ')
      );
      printFooterLine();
    }
  };
}

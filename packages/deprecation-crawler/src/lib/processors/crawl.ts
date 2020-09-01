import { CrawlConfig, CrawledRelease, CrawlerProcess } from '../models';
import { concat, getPathFilter, tap } from '../utils';
import { crawlDeprecations, getSourceFiles } from '../crawler';
import { addRuid } from '../tasks/add-ruid';
import {
  printFooterLine,
  printHeadline,
  printProgress,
  ProcessFeedback,
} from '../log';
import * as kleur from 'kleur';
import * as minimatch from 'minimatch';

const feedback = getCrawlFeedback();

/**
 * Look for deprecations
 * Adds the deprecations to the release
 */
export function crawl(config: CrawlConfig): CrawlerProcess {
  return concat([
    tap(
      async (r): Promise<CrawledRelease> => {
        feedback.printStart(config, r);
        return r;
      }
    ),
    async (r): Promise<CrawledRelease> => {
      const deprecations = await crawlDeprecations(config, r);
      return {
        ...r,
        deprecations,
      };
    },
    addRuid(config),
    tap(
      async (r): Promise<CrawledRelease> => {
        feedback.printEnd(config, r);
        return r;
      }
    ),
  ]);
}

function getCrawlFeedback(): ProcessFeedback {
  return {
    printStart(config: CrawlConfig, r: CrawledRelease): void {
      printHeadline('CRAWL PHASE');
      console.log(
        kleur.gray(`🔎 Looking for deprecations in: `),
        kleur.black(`${r.tag}`)
      );
      console.log(kleur.gray(`Date: ${r}`));
      printProgress();
    },

    async printEnd(
      config: CrawlConfig,
      rawRelease: CrawledRelease
    ): Promise<void> {
      const files = await getSourceFiles(config);
      console.log(
        kleur.green('✓ '),
        kleur.gray(`Found `),
        kleur.black(`${rawRelease.deprecations.length}`),
        kleur.gray(` in `),
        kleur.black(
          files
            // @TODO reuse this logic or better implement it before the .getSourceFiles method is called
            .filter((file) => {
              const pathFilter = getPathFilter() || config.pathFilter;
              return pathFilter
                ? minimatch(file.getFilePath(), pathFilter)
                : true;
            }).length
        ),
        kleur.gray(` files.`)
      );
      console.log(
        kleur.gray(`Used tsConfig `),
        kleur.black(`${config.tsConfigPath}`),
        kleur.gray(` and pathFilter of `),
        kleur.black(`'${config.pathFilter}'`)
      );
      printFooterLine();
    },
  };
}

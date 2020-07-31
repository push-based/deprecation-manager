import { getConfig } from "./config";

import { CrawledRelease } from "./models";
import { crawlDeprecations } from "./crawler";
import { checkout } from "./checkout";

import { addGrouping } from "./processors/grouping";
import { addUniqueKey } from "./processors/unique";
import { addCommentToRepository, generateMarkdown, generateRawJson } from "./output-formatters/";
import { askToSkip, concat, tap } from "./utils";

(async () => {
  const config = await getConfig();

  const date = await checkout(config);
  const deprecations = await crawlDeprecations(config);

  const crawledRelease: CrawledRelease = {
    version: config.gitTag,
    date,
    deprecations
  };

  const processors = [
    // Crawling Phase
    concat([
      async (r: CrawledRelease): Promise<CrawledRelease> => ({
        ...crawledRelease,
        deprecations: await addUniqueKey(config, crawledRelease.deprecations)
      }),
      tap((r: CrawledRelease) => generateRawJson(config, r.deprecations, { tagDate: r.date }))
    ]),
    // Repo Update
    askToSkip(
      "Repo Update?",
      tap((r: CrawledRelease) => addCommentToRepository(config, r.deprecations))
    ),
    // Grouping Phase
    askToSkip(
      "Grouping?",
      concat([
        async (r: CrawledRelease) => ({
          ...r,
          deprecations: await addGrouping(config, r.deprecations)
        }),
        tap((r: CrawledRelease) => generateRawJson(config, r.deprecations, { tagDate: r.date }))
      ])
    ),
    // Formatting Phase
    askToSkip(
      "Markdown?",
      tap((r: CrawledRelease) => generateMarkdown(config, r.deprecations, { tagDate: date }))
    )
  ];

  // Run all processors
  concat(processors)(crawledRelease);

})();

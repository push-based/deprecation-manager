import { getConfig } from "./config";

import { BooleanPrompt, CrawledRelease, CrawlerProcess } from "./models";
import { crawlDeprecations } from "./crawler";
import { checkout } from "./checkout";

import { addGrouping } from "./processors/grouping";
import { addUniqueKey } from "./processors/unique";
import { addCommentToRepository, generateMarkdown, generateRawJson } from "./output-formatters/";
import { prompt } from "enquirer";

(async () => {
  const config = await getConfig();

  const date = await checkout(config);
  const deprecations = await crawlDeprecations(config);

  const crawledRelease: CrawledRelease = {
    version: config.gitTag,
    date,
    deprecations
  };

  const crawlingPhaseProcessors = [
    // Crawling Phase
    async (r: CrawledRelease): Promise<CrawledRelease> => ({
      ...crawledRelease,
      deprecations: await addUniqueKey(config, crawledRelease.deprecations)
    }),
    // Persistence Phase
    awaitTap((r: CrawledRelease) => generateRawJson(config, r.deprecations, { tagDate: r.date })),
    // Repo Update
    askToSkip(
      "Repo Update?",
      awaitTap((r: CrawledRelease) => addCommentToRepository(config, r.deprecations)),

    ),
    // Grouping Phase
    askToSkip(
      "Grouping?",
      async (r: CrawledRelease) => ({
        ...r,
        deprecations: await addGrouping(config, r.deprecations)
      })
    ),
    // Persistence Phase
    awaitTap((r: CrawledRelease) => generateRawJson(config, r.deprecations, { tagDate: r.date })),
    // Formatting Phase
    askToSkip(
      "Markdown?",
      awaitTap((r: CrawledRelease) => generateMarkdown(config, r.deprecations, { tagDate: date }))
    )
  ];

  // Run Processes
  const processedCrawledDeprecations = (await crawlingPhaseProcessors.reduce(
    async (deps, processor) => await processor(await deps),
    Promise.resolve(crawledRelease)
  )) as CrawledRelease;

})();

function awaitTap<I>(process: CrawlerProcess<I, I | void>): CrawlerProcess<I, I> {
  return async function(d: I): Promise<I> {
    await process(d);
    return Promise.resolve(d);
  };
}

function askToSkip<I>(question: string, process: CrawlerProcess<I, I>): CrawlerProcess<I, I> {
  return async function(d: I): Promise<I> {

    const answer: {skip: string} = await prompt([{
      type: "select",
      name: "skip",
      message: question,
      choices: [
      { name: 'Y' },
      { name: 'n', value: false }
      ]
    } as any]);

    console.log('answer.skip',answer.skip);
    if (answer.skip == 'n') {
      return Promise.resolve(d);
    }
    return await process(d);
  };
}

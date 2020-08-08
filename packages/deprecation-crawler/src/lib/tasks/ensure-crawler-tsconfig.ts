import { CrawlConfig } from "../models";
import { prompt } from "enquirer";
import { normalize } from "path";
import { TSCONFIG_PATH } from "../constants";
import { findTsConfigFiles } from "../config";
import { readFileSync, writeFileSync } from "fs";
import { format, resolveConfig } from "prettier";
import { fileExists } from "@nrwl/workspace/src/utils/fileutils";

export async function ensureTsConfigPath(config: CrawlConfig): Promise<CrawlConfig> {

  const tsConfigFiles: string[] = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error("We need a tsconfig file to crawl");
  }

  if (fileExists(TSCONFIG_PATH)) {
    // @TODO Should we do any other tests?
    // @Note The file exists because of the above check for tsConfig files.
    return config;
  } else {
    // @TODO Fail here in CI mode

    console.log("Setup ", TSCONFIG_PATH);

    const tsConfigPathAnswer: { baseTsConfigPath: string } = await prompt([
      {
        type: "select",
        name: "tsConfigPath",
        message: "What's the location of the base ts config file to extend from?",
        choices: findTsConfigFiles(),
        format(value) {
          return value ? normalize(value) : "";
        },
        initial: tsConfigFiles[0] as any,
        skip: tsConfigFiles.length === 1
      }
    ]);
    const baseTsConfigFile = readFileSync(tsConfigPathAnswer.baseTsConfigPath);
    const baseTsConfig = JSON.parse(baseTsConfigFile as any);

    const { files, exclude, include } = baseTsConfig;
    const crawlerTsConfig = {
      // If no 'files' or 'include' property is present in a tsconfig.json,
      // the compiler defaults to including all files in the containing directory
      // and subdirectories except those specified by 'exclude'.
      // When a 'files' property is specified, only those files
      // and those specified by 'include' are included.
      files: files || [],
      // Specifies a list of files to be excluded from compilation.
      // The 'exclude' property only affects the files included via the 'include'
      // property and not the 'files' property. Glob patterns require TypeScript version 2.0 or later.
      exclude: exclude || [],
      //Specifies a list of glob patterns that match files to be included in compilation.
      // If no 'files' or 'include' property is present in a tsconfig.json,
      // the compiler defaults to including all files in the containing directory
      // and subdirectories except those specified by 'exclude'.
      // Requires TypeScript version 2.0 or later.
      include: include || []
    };

    const prettiedCrawlerTsConfig = format(JSON.stringify(crawlerTsConfig), {
      parser: "json",
      ...resolveConfig.sync("./")
    });
    console.log(`Generated ${TSCONFIG_PATH}: ${prettiedCrawlerTsConfig}`);
    console.log(`From now on this the crawler will use this as tsConfig file. You can edit it every time.`);
    console.log(`If you delete it it will get recreated.`);
    writeFileSync(TSCONFIG_PATH, prettiedCrawlerTsConfig);
  }

  return config;
}

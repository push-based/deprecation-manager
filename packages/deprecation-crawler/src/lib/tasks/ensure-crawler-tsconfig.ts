import { CrawlConfig } from "../models";
import { prompt } from "enquirer";
import { normalize } from "path";
import { CRAWLER_CONFIG_PATH, SKIP_PROMPT_SELECTION_CHOICE, TSCONFIG_PATH } from "../constants";
import { readFileSync, writeFileSync } from "fs";
import { format, resolveConfig } from "prettier";
import { fileExists } from "@nrwl/workspace/src/utils/fileutils";
import { sandBoxMode, updateRepoConfig } from "../utils";
import { glob } from "glob";

export async function ensureTsConfigPath(config: CrawlConfig): Promise<CrawlConfig> {

  const tsConfigFiles: string[] = [SKIP_PROMPT_SELECTION_CHOICE, ...findTsConfigFiles()];
  if (tsConfigFiles.length === 0) {
    tsConfigFiles.push(SKIP_PROMPT_SELECTION_CHOICE)
  }

  if (fileExists(config.tsConfigPath)) {
    console.log(`Crawling with tsconfig: ${config.tsConfigPath}`);
    // @Note The file exists because of the above check for tsConfig files.
    return config;
  }

  if (sandBoxMode()) {
    throw new Error(`${config.tsConfigPath} should already exist in CI mode`);
  }

  console.log("Setup ", TSCONFIG_PATH);

  const tsConfigPathAnswer: { baseTsConfigPath: string } = await prompt([
    {
      type: "select",
      name: "baseTsConfigPath",
      message: "What's the location of the base ts config file to extend from?",
      choices: tsConfigFiles,
      format(value) {
        return value ? normalize(value) : "";
      },
      initial: tsConfigFiles[0] as any,
      skip: tsConfigFiles.length === 1
    }
  ]);
  const skippedBaseTsConfig = tsConfigPathAnswer.baseTsConfigPath === SKIP_PROMPT_SELECTION_CHOICE;
  // The default makes it more obvious for the user to understand why everything is crawled
  const defaultTsConfig = JSON.stringify({include: ["**/*.ts"]});
  const baseTsConfigFile =  skippedBaseTsConfig ? defaultTsConfig : readFileSync(tsConfigPathAnswer.baseTsConfigPath) || defaultTsConfig;
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

  // create tsconfig
  writeFileSync(TSCONFIG_PATH, prettiedCrawlerTsConfig);
  console.log(``);
  console.log(`Generated ${TSCONFIG_PATH}: ${prettiedCrawlerTsConfig}`);
  console.log(`From now on this the crawler will use this as tsConfig file.
               You can edit it every time.`);
  console.log(`You can also change the location by editing the tsConfigPath in ${CRAWLER_CONFIG_PATH}.`);
  console.log(`If you delete it it will get recreated.`);
  console.log(``);

  // update repoConfig
  const newConfig = { ...config, tsConfigPath: TSCONFIG_PATH };
  updateRepoConfig(newConfig);
  return newConfig;
}

export function findTsConfigFiles(): string[] {
  return  glob.sync('**/*tsconfig*.json', {
    ignore: '**/node_modules/**',
  });
}

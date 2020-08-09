import { normalize } from "path";
import { prompt } from "enquirer";
import { glob } from "glob";
import { CrawlConfig } from "./models";
import { CRAWLER_CONFIG_PATH, TSCONFIG_PATH } from "./constants";
import { readFile, updateRepoConfig } from "./utils";
import { execSync } from "child_process";

export async function getConfig(): Promise<CrawlConfig> {
  const repoConfigFile = readFile(CRAWLER_CONFIG_PATH) || "{}";
  const repoConfig = JSON.parse(repoConfigFile);

  const tsConfigFiles = findTsConfigFiles();
  if (tsConfigFiles.length === 0) {
    throw Error("We need a tsconfig file to crawl");
  }
  const defaultTag = "main";
  const tagChoices = sortTags(getGitHubBranches(defaultTag), getGitHubTags(), defaultTag);
  const userConfig: CrawlConfig = await prompt([
    {
      type: "select",
      name: "gitTag",
      message: `What git tag do you want to crawl?`,
      skip: !!process.argv.slice(2)[0],
      // @NOTICE: by using choices here the initial value has to be typed as number.
      // However, passing a string works :)
      initial:
        ((process.argv.slice(2)[0] as unknown) as number) ||
        ((defaultTag as unknown) as number),
      choices: tagChoices
    },
    {
      type: "input",
      name: "outputDirectory",
      message: "What's the output directory?",
      initial: repoConfig.outputDirectory || "./deprecations",
      skip: !!repoConfig.outputDirectory
    },
    {
      type: "select",
      name: "tsConfigPath",
      message: "What's the location of the ts config file?",
      choices: findTsConfigFiles(),
      format(value) {
        return value ? normalize(value) : "";
      },
      initial:
        repoConfig.tsConfigPath ||
        tsConfigFiles.find((p) => p === TSCONFIG_PATH) ||
        tsConfigFiles[0],
      skip: !!repoConfig.tsConfigPath || tsConfigFiles.length === 1
    },
    {
      type: "input",
      name: "deprecationComment",
      message: "What's the deprecation keyword to look for?",
      initial: repoConfig.deprecationComment || "@deprecated",
      skip: !!repoConfig.deprecationComment
    },
    {
      type: "input",
      name: "deprecationLink",
      message:
        "What's the deprecation link to the docs (the deprecation ruid will be appended to this)?",
      initial: repoConfig.deprecationLink || "https://rxjs.dev/deprecations",
      skip: !!repoConfig.deprecationLink
    }
  ]);

  const config = { groups: [], ...repoConfig, ...userConfig };
  updateRepoConfig(config);
  return config;
}

export function findTsConfigFiles() {
  const tsConfigs = glob.sync("**/*tsconfig*.json", {
    ignore: "**/node_modules/**"
  });
  return [
    TSCONFIG_PATH,
    ...tsConfigs.filter((i) => i.indexOf(TSCONFIG_PATH) === -1)
  ];
}

function sortTags(tags: string[], branches: string[], first: string): string[] {
  // @TODO
  const withoutFirst = branches.filter(b => b === first)
  // prioritize current branch
  // prioritize tags before branches
  // normalize v1.0.0 and v1.0.0
  return [...withoutFirst.sort(innerSort), ...tags.sort(innerSort), first];

  function innerSort(a: string, b: string): number {
    const normalizedA = normalizeSemverIfPresent(a);
    const normalizedB = normalizeSemverIfPresent(b);

    return (/[A-Za-z]/.test(normalizedA) as unknown as number) - (/[A-Za-z]/.test(normalizedB) as unknown as  number) || (normalizedA.toUpperCase() < normalizedB.toUpperCase() ? 1 : normalizedA.toUpperCase() > normalizedB.toUpperCase() ? -1 : 0);
  }

  function normalizeSemverIfPresent(str: string): string {
    const regex = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/;
    const potentialVersionNumber = str[0].toLowerCase() === "v" ? str.slice(1) : str;
    return regex.test(potentialVersionNumber) ? potentialVersionNumber : str;
  }
}

export function getGitHubTags(): string[] {
  return execSync("git tag").toString().trim().split("\n").map((s) => s.trim()).sort();
}

export function getGitHubBranches(defaultTag: string): string[] {
  return [
    defaultTag,
    ...execSync("git branch")
      .toString()
      .trim()
      .split("\n")
      .map((s) => s.trim())
      // @TODO remove ugly hack for the `*` char of the current branch
      .map((i) => i.split("* ").join(""))
      .filter((v) => v !== defaultTag)
  ].sort();
}

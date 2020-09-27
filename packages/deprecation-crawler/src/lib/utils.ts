import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import {
  CrawlConfig,
  CrawlerProcess,
  CrawledRelease,
  Deprecation,
} from './models';

import {
  format as prettier,
  Options as PrettierOptions,
  resolveConfig,
} from 'prettier';
import {
  CRAWLER_CONFIG_PATH,
  CRAWLER_MODES,
  RAW_DEPRECATION_PATH,
} from './constants';
import { prompt } from 'enquirer';
import * as yargs from 'yargs';
import { join, dirname } from 'path';
import simpleGit, { DiffResultTextFile } from 'simple-git';
import * as kleur from 'kleur';
import * as semverHelper from 'semver';
import { logError } from './log';

export function getSiblingPgkJson(
  pathOrFile: string
): {
  version: string;
  homepage?: string;
  repository?: { url: string };
} {
  return JSON.parse(
    readFile(join(dirname(pathOrFile), 'package.json')) || '{}'
  );
}

export const git = proxyMethodToggles(
  simpleGit(),
  ['commit', 'push', 'clone', 'checkout'],
  () => toggles.executeGitCommands
);

export function proxyMethodToggles<T>(
  obj: T,
  methodNames: string[],
  condition: () => boolean
): T {
  const handler = {
    get(target, propKey) {
      const origMethod = target[propKey];

      if (typeof origMethod === 'function') {
        return function (...args) {
          if (methodNames.includes(propKey)) {
            if (condition()) {
              return origMethod.apply(this, args);
            }
            logVerbose(`Call of method ${propKey} got ignored through toggle.`);
            return Promise.resolve();
          }
          return origMethod.apply(this, args);
        };
      }
      return origMethod;
    },
  };
  return new Proxy(obj, handler);
}

export function hash(str: string) {
  const s = str.replace(/ /g, '').replace(/\r\n/g, '\n');
  let hash = 5381;
  let i = s.length;

  while (i) {
    hash = (hash * 33) ^ s.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return (hash >>> 0).toString();
}

export function ensureDirExists(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function updateRepoConfig(config: CrawlConfig): void {
  const crawlerConfigPath = getConfigPath();
  logVerbose(`update config under ${crawlerConfigPath}`);
  writeFileSync(crawlerConfigPath, formatCode(JSON.stringify(config), 'json'));
}

export function readRepoConfig(): CrawlConfig {
  const crawlerConfigPath = getConfigPath();
  const repoConfigFile = readFile(crawlerConfigPath) || '{}';
  return JSON.parse(repoConfigFile);
}

export function readRawDeprecations(
  config: CrawlConfig
): { deprecations: Deprecation[]; path: string } {
  ensureDirExists(config.outputDirectory);
  const path = join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`);

  let deprecations: Deprecation[] = [];

  if (!existsSync(path)) {
    return { deprecations, path };
  }

  try {
    const t = readFileSync(path);
    deprecations = JSON.parse((t as unknown) as string);
  } catch (e) {
    deprecations = [];
  }

  return { deprecations, path };
}

export function writeRawDeprecations(
  deprecations: Deprecation[],
  config: CrawlConfig
): void {
  ensureDirExists(config.outputDirectory);
  const path = join(config.outputDirectory, `${RAW_DEPRECATION_PATH}`);

  const sortedDeprecations = semverSort(
    deprecations,
    false,
    (d: Deprecation) => d.version
  );

  const json = JSON.stringify(sortedDeprecations, null, 4);
  writeFileSync(path, json);
}

export function semverSort(
  semvers: any[],
  asc: boolean,
  pick: (v: any) => string = (v: string): string => v
) {
  try {
    return semvers.sort(function (v1, v2) {
      const p1 = pick(v1);
      const p2 = pick(v2);
      if (p1 === p2) {
        return 0;
      }
      if (!p1) {
        return asc ? -1 : 1;
      }
      if (!p2) {
        return asc ? 1 : -1;
      }
      const sv1 = SERVER_REGEX.exec(p1)?.[0] || p1;
      const sv2 = SERVER_REGEX.exec(p2)?.[0] || p2;

      return asc
        ? semverHelper.compare(sv1, sv2)
        : semverHelper.rcompare(sv1, sv2);
    });
  } catch (err) {
    logError(err);
    return semvers;
  }
}

/**
 * Check for path params from cli command
 */
export function getConfigPath(): string {
  const argPath = getCliParam(['path', 'p']);
  return argPath ? argPath : CRAWLER_CONFIG_PATH;
}

/**
 * Check for path params from cli command
 */
export function getInteractive(): boolean {
  const argPath = getCliParam(['interactive']);
  return getBooleanParam(argPath);
}

function getBooleanParam(paramValue: string | boolean): boolean {
  if (paramValue === false) {
    return false;
  }
  return paramValue !== 'false';
}

/**
 * Check for verbose params from cli command
 */
export function getVerboseFlag(): boolean {
  const argPath = getCliParam(['verbose', 'v']);
  return !!argPath;
}

export function logVerbose(message: string, enforceLog = false): void {
  if (getVerboseFlag() || enforceLog) {
    return console.log(kleur.gray(message));
  }
}

/**
 * Check for version params from cli command
 */
export function getVersion() {
  const argPath = getCliParam(['nextVersion', 'n']);
  return argPath ? argPath : '';
}

export function formatCode(
  code: string,
  parser: PrettierOptions['parser'] = 'typescript'
) {
  const prettierConfig = resolveConfig.sync(__dirname);
  return prettier(code, {
    parser,
    ...prettierConfig,
  }).trim();
}

/**
 * Ensures the file exists before reading it
 */
export function readFile(path: string) {
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  return '';
}

/**
 * Upper camelCase to lowercase, hypenated
 */
export function toFileName(s: string): string {
  return s
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[ _]/g, '-')
    .replace(/[/\\]/g, '-');
}

export function getCliParam(names: string[]): string | false {
  // @TODO move  cli stuff into separate task
  // Check for tag params from cli command
  const params = Object.keys(yargs.argv)
    .filter((k) => names.includes(k))
    .map((k) => yargs.argv[k].toString().trim())
    .filter((p) => !!p);
  return params.length ? params.pop() : false;
}

export function run(
  tasks: ((config: CrawlConfig) => CrawlerProcess)[],
  config: CrawlConfig
): CrawlerProcess {
  return concat(tasks.map((s) => s(config)));
}

export function concat(processes: CrawlerProcess[]): CrawlerProcess {
  return async function (r: CrawledRelease): Promise<CrawledRelease | void> {
    return await processes.reduce(
      async (deps, processor) => await processor(await deps),
      Promise.resolve(r)
    );
  };
}

export function tap(process: CrawlerProcess): CrawlerProcess {
  return async function (d: CrawledRelease): Promise<CrawledRelease> {
    await process(d);
    return Promise.resolve(d);
  };
}

export function askToSkip(
  question: string,
  crawlerProcess: CrawlerProcess,
  options: {
    precondition?: (r: CrawledRelease) => Promise<boolean>;
  } = {
    precondition: async () => true,
  }
): CrawlerProcess {
  return async function (d: CrawledRelease): Promise<CrawledRelease | void> {
    const isPreconditionMet = await options.precondition(d);

    if (!isPreconditionMet) {
      return d;
    }

    if (await shouldProceed(question)) {
      return await crawlerProcess(d);
    }

    return d;
  };
}

async function shouldProceed(question: string) {
  if (toggles.autoAnswerQuestions) {
    return true;
  }

  const answer: { proceed: boolean } = await prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: question,
      initial: true,
    },
  ]);

  return answer.proceed;
}

export async function getCurrentHeadName(): Promise<string> {
  // That will output the value of HEAD,
  // if it's not detached, or emit the tag name,
  // if it's an exact match. It'll show you an error otherwise.
  return git
    .raw(['symbolic-ref -q --short HEAD'])
    .then((out) => out.trim())
    .catch(() => git.raw(['describe --tags --exact-match']));
}

/**
 * @description Get all the tags for a given branch.
 *
 * @return - List of git tags.
 * @throws - If the `git` command fails.
 */
export async function getTags(branch): Promise<string[]> {
  return (await git.tag(['--merged', branch]))
    .split('\n')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function getCurrentBranchOrTag() {
  return (
    (await git.branch().then((r) => r.current)) ||
    // @TODO replace with simple git
    (await git.raw(['describe --tags --exact-match']).then((out) => out.trim()))
  );
}

export async function branchHasChanges(): Promise<boolean> {
  return await git.status(['-s']).then((r) => Boolean(r.files.length));
}

export async function getFilesWithInsertionWithin2Hashes(diffConfig: {
  from: string;
  to: string;
}) {
  const gitDiff = await git.diffSummary([
    `${diffConfig.from}...${diffConfig.to}`,
  ]);
  return gitDiff.files
    .filter((f) => !f.binary && (f as DiffResultTextFile).insertions > 0)
    .map((f) => f.file);
}

export async function getRemoteUrl(): Promise<string> {
  return (
    git
      .listRemote([`--get-url`])
      // remove line ending
      .then((x) => x.trim())
  );
}

export async function getFilesWithDeletionsWithin2Hashes(
  config: CrawlConfig,
  diffConfig: {
    from: string;
    to: string;
  }
) {
  // NOTICE: maybe diff directly is better
  // git.diff([`${diffConfig.from}...${diffConfig.to}`, `--diff-filter=DRM`, `-G"${config.deprecationComment}"`, `-U0`, `--stat`]);
  const gitDiff = await git.diffSummary([
    `${diffConfig.from}...${diffConfig.to}`,
    // Docs: https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---diff-filterACDMRTUXB82308203
    // Uppercase e.g. M includes files, lowercase e.g. m removes files
    `--diff-filter=TMRD`,
    `-G"${config.deprecationComment}"`,
    // @TODO add config.pathFilter here
  ]);
  return gitDiff.files
    .filter(
      (f) =>
        (!f.binary && (f as DiffResultTextFile).deletions > 0) ||
        (f as DiffResultTextFile).changes > 0
    )
    .map((f) => f.file);
}

export function getCrawlerMode() {
  return process.env.__CRAWLER_MODE__;
}

export function isCrawlerModeSandbox(): boolean {
  return getCrawlerMode() === CRAWLER_MODES.SANDBOX;
}

export function isCrawlerModeCi(): boolean {
  return getCrawlerMode() === CRAWLER_MODES.CI;
}

/**
 * Feature toggles for different modes
 */
export const toggles = {
  autoAnswerQuestions: isCrawlerModeSandbox(),
  executeGitCommands: !isCrawlerModeSandbox(),
};

/*
The `<` and `>` mark start and end of a match
e.g. package@1.2.3-prerelease.1 with marked match looks like package@<1.2.3-prerelease.1>
<0.0.0>
<0.0.0-alpha>
<0.0.0-alpha.0>
<1.2.3>
<11.22.33>
<1.2.3-alpha>
<11.22.33-alpha>
<1.2.3-alpha.4>
<11.22.33-alpha.4>
<11.22.33-alpha-44>
<1.2.3-alpha-4>
package@<1.2.3-alpha>
package-<1.2.3-alpha.0>
--
WRONG:
00.00.00 (multiple zeros)
11.22+33-alpha.4 (wrong patch separator)
11.22.33+alpha.4 (wrong prerelease separator)
11.22.33-alpha?4 (wrong prerelease separator)
package-<11.22.33-alpha.0> (wrong package separator)
 */
export const SERVER_REGEX = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?=$|\s)/i;
// export const SERVER_REGEX = /(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/i;

/*
The `<` and `>` mark start and end of a match
e.g. package@1.2.3-alpha.1 with marked match looks like package@<1.2.3-alpha.1>
<0>
<0.0>
--
WRONG:
1. (not ending on space or newline)
 */
export const MAJOR_SERVER_REGEX = /(^v*(?:0|[1-9]*))(?=$|\s)/i;

/*
The `<` and `>` mark start and end of a match
e.g. package@1.2.3-alpha.1 with marked match looks like package@<1.2.3-alpha.1>
<0.0>
<1.2>
--
WRONG:
1 (no minor version)
 */
export const MAJOR_MINOR_SERVER_REGEX = /(^v*(?:0|[1-9]*))\.(?:0|[1-9]*)(?=$|\s)/i;

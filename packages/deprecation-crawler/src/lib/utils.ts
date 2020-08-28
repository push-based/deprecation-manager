import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { CrawlConfig, CrawledRelease, CrawlerProcess } from './models';
import {
  format as prettier,
  Options as PrettierOptions,
  resolveConfig,
} from 'prettier';
import { CRAWLER_CONFIG_PATH, CRAWLER_MODES } from './constants';
import { prompt } from 'enquirer';
import * as yargs from 'yargs';
import simpleGit from 'simple-git';
import * as kleur from 'kleur';

export const git = proxyMethodToggles(
  simpleGit(),
  ['commit', 'push', 'clone'],
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
            if (getVerboseFlag()) {
              console.log(
                kleur.gray(
                  `Call of method ${propKey} got ignored through toggle.`
                )
              );
            }
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
  writeFileSync(crawlerConfigPath, formatCode(JSON.stringify(config), 'json'));
}

export function readRepoConfig(): CrawlConfig {
  const crawlerConfigPath = getConfigPath();
  const repoConfigFile = readFile(crawlerConfigPath) || '{}';
  return JSON.parse(repoConfigFile);
}

export function getConfigPath() {
  // Check for path params from cli command
  const argPath = getCliParam(['path', 'p']);
  return argPath ? argPath : CRAWLER_CONFIG_PATH;
}

export function getVerboseFlag() {
  // Check for path params from cli command
  const argPath = getCliParam(['verbose']);
  return argPath ? argPath : false;
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
  return async function (d: CrawledRelease): Promise<CrawledRelease | void> {
    return await processes.reduce(
      async (deps, processor) => await processor(await deps),
      Promise.resolve(d)
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

export async function getRemoteUrl(): Promise<string> {
  return git.listRemote([`--get-url`]);
}

export function getCrawlerMode() {
  return process.env.__CRAWLER_MODE__;
}

export function isCrawlerModeSandbox(): boolean {
  return getCrawlerMode() === CRAWLER_MODES.SANDBOX;
}
export function isCrawlerModeCi(): boolean {
  return getCrawlerMode() === CRAWLER_MODES.SANDBOX;
}

/**
 * Feature toggles for different modes
 */
export const toggles = {
  autoAnswerQuestions: isCrawlerModeSandbox(),
  executeGitCommands: !isCrawlerModeSandbox(),
};

export const SERVER_REGEX = /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/i;

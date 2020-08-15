import * as cp from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { CrawlConfig, CrawlerProcess, CrawledRelease } from './models';
import {
  format as prettier,
  resolveConfig,
  Options as PrettierOptions,
} from 'prettier';
import { CRAWLER_CONFIG_PATH, CRAWLER_MODES } from './constants';
import { prompt } from 'enquirer';

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
    mkdirSync(dir);
  }
}

export function updateRepoConfig(config: CrawlConfig) {
  // exclude gitTag from the persisted config
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gitTag: _, ...writableConfig } = config;
  const path = config.configPath || CRAWLER_CONFIG_PATH;
  writeFileSync(path, formatCode(JSON.stringify(writableConfig), 'json'));
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
    .replace(/[ _]/g, '-');
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

export async function git(args: string[]): Promise<string> {
  if (!toggles.executeGitCommands) {
    return '';
  }
  const out = await cmd('git', args);
  return out.trim();
}

export async function getCurrentHeadName(): Promise<string> {
  // That will output the value of HEAD,
  // if it's not detached, or emit the tag name,
  // if it's an exact match. It'll show you an error otherwise.
  return git([
    'symbolic-ref -q --short HEAD || git describe --tags --exact-match',
  ]);
}

/**
 * @description Get all the tags for a given branch.
 *
 * @return - List of git tags.
 * @throws - If the `git` command fails.
 */
export async function getTags(branch): Promise<string[]> {
  return (await git(['tag', '--merged', branch]))
    .split('\n')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function getCurrentBranchOrTag() {
  return (
    (await git(['branch', '--show-current'])) ||
    (await git(['describe', ' --tags --exact-match']))
  );
}

export async function branchHasChanges() {
  const out = await git(['status', '-s']);
  return Boolean(out);
}

export async function getRemoteUrl(): Promise<string> {
  return git([`config --get remote.origin.url`]);
}

export function cmd(command: string, args: string[]): Promise<string> {
  return exec(command, args);
}

export function exec(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command + ' ' + args.join(' '), (err, stdout) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout.toString());
    });
  });
}

/**
 * Feature toggles for different modes
 */
export const toggles = {
  autoAnswerQuestions: process.env.__CRAWLER_MODE__ === CRAWLER_MODES.SANDBOX,
  executeGitCommands: process.env.__CRAWLER_MODE__ !== CRAWLER_MODES.SANDBOX,
};

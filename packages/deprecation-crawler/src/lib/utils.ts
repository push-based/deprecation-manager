import * as cp from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { CrawlConfig, CrawlerProcess } from './models';
import { format, resolveConfig } from 'prettier';
import { CRAWLER_CONFIG_PATH } from './constants';
import { prompt } from 'enquirer';

export function hash(str: string) {
  const s = str.replace(/ /g, '');
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
  const { gitTag, ...writableConfig } = config;
  const prettiedConfig = format(JSON.stringify(writableConfig), {
    parser: 'json',
    ...resolveConfig.sync('./'),
  });

  writeFileSync(CRAWLER_CONFIG_PATH, prettiedConfig);
}

export function readFile(path: string) {
  if (existsSync(path)) {
    return readFileSync(path, 'utf-8');
  }
  return '';
}

export function concat<I>(
  processes: CrawlerProcess<I, I>[]
): CrawlerProcess<I, I> {
  return async function (d: I): Promise<I> {
    return await processes.reduce(
      async (deps, processor) => await processor(await deps),
      Promise.resolve(d)
    );
  };
}

export function tap<I>(
  process: CrawlerProcess<I, I | void>
): CrawlerProcess<I, I> {
  return async function (d: I): Promise<I> {
    await process(d);
    return Promise.resolve(d);
  };
}

export function askToSkip<I>(
  question: string,
  crawlerProcess: CrawlerProcess<I, I>
): CrawlerProcess<I, I> {
  return async function (d: I): Promise<I> {
    if (sandBoxMode()) {
      return await crawlerProcess(d);
    }

    const answer: { skip: string } = await prompt([
      {
        type: 'select',
        name: 'skip',
        message: question,
        choices: [{ name: 'Y' }, { name: 'n', value: false }],
      } as any,
    ]);

    if (answer.skip == 'n') {
      return Promise.resolve(d);
    }
    return await crawlerProcess(d);
  };
}

export function git(args: string[]): Promise<string> {
  return cmd('git', args);
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

// used to determine if tests are running in sandbox mode
// otherwise the test will get stuck on cli questions
export function sandBoxMode() {
  return process.env.CRAWLER_SANDBOX_MODE === 'true';
}

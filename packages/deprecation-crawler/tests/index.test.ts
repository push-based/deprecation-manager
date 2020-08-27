import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { RAW_DEPRECATION_PATH, CRAWLER_MODES } from '../src/lib/constants';

const SANDBOX_PATH = path.join(__dirname, '..', 'sandbox');
const RAW_DEPRECATION_FILE = path.join(
  SANDBOX_PATH,
  'deprecations',
  RAW_DEPRECATION_PATH
);

const testcases = fs
  .readdirSync(SANDBOX_PATH)
  .filter((name) => name !== 'deprecations') // output folder
  .map((name) => path.join(SANDBOX_PATH, name))
  .filter((name) => fs.lstatSync(name).isDirectory())
  .map((testcase) => {
    const input = path.join(testcase, 'input.ts');
    const crawled = path.join(testcase, 'crawled.ts');
    const output = path.join(testcase, 'output.ts');
    return {
      input,
      crawled,
      output,
    };
  });

beforeAll(async () => {
  testcases.forEach((testcase) => {
    fs.copyFileSync(testcase.input, testcase.crawled);
    rimraf(path.join(SANDBOX_PATH, 'deprecations'), (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
});

test('sandbox', async () => {
  const cliOutput = await exec(`npm run crawl -- -t master --verbose`);

  // verify output
  expect(cliOutput).toMatch(/Running with tsconfig: tsconfig.sandbox.json/i);
  expect(cliOutput).toMatch(/SETUP PHASE/i);
  expect(cliOutput).toMatch(/tsconfig.sandbox.json/i);
  expect(cliOutput).toMatch(/CRAWL PHASE/i);
  expect(cliOutput).toMatch(/GROUPING PHASE/i);
  expect(cliOutput).toMatch(/FORMAT OUTPUT/i);
  expect(cliOutput).toMatch(/Update tag-based markdown format/i);
  expect(cliOutput).toMatch(/Update group-based markdown format/i);

  // verify changes to repo
  testcases.forEach((testcase) => {
    const crawledContent = fs.readFileSync(testcase.crawled, 'utf8');
    const expectedContent = fs.readFileSync(testcase.output, 'utf8');
    expect(crawledContent).toBe(expectedContent);
  });

  // verify json
  const rawDeprecations = JSON.parse(
    fs.readFileSync(RAW_DEPRECATION_FILE, 'utf8')
  );

  expect(rawDeprecations).toHaveLength(14);
  expect(
    rawDeprecations.filter((d) => d.group === 'all-lowercase')
  ).toHaveLength(3);
  expect(
    rawDeprecations.filter((d) => d.group === 'whitespace-normalisation')
  ).toHaveLength(3);
  // BUG: this has to have 3 hits
  expect(
    rawDeprecations.filter(
      (d) => d.group === 'multiple-string-patterns-at-once'
    )
  ).toHaveLength(0);
  // BUG: this has to have 0 hits
  expect(rawDeprecations.filter((d) => d.group === 'catch-all')).toHaveLength(
    3
  );

  // without passing a version via the CLI, new deprecations shouldn't have a version
  expect(rawDeprecations.filter((d) => d.version !== '')).toHaveLength(0);

  // by passing a version via the CLI (existing) deprecations should be updated to the version
  const version = '5.4.2';
  await exec(`npm run crawl -- -t master --next-version ${version}`);
  const updatedRawDeprecations = JSON.parse(
    fs.readFileSync(RAW_DEPRECATION_FILE, 'utf8')
  );
  expect(
    updatedRawDeprecations.filter((d) => d.version !== version)
  ).toHaveLength(0);
}, 60_000);

function exec(command) {
  return new Promise((resolve, reject) => {
    cp.exec(
      command,
      {
        cwd: SANDBOX_PATH,
        env: {
          ...process.env,
          __CRAWLER_MODE__: CRAWLER_MODES.SANDBOX,
        },
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(err);
        }
        if (stderr) {
          return reject(stderr);
        }
        resolve(stdout);
      }
    );
  });
}

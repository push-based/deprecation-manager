import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';
import * as rimraf from 'rimraf';

const SANDBOX_PATH = path.join(__dirname, '..', 'sandbox');

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
  // BUG: format tag to be able to save the file, e.g. pr/foo
  // const currentGitTag = await git([`branch --show-current`]);
  const cliOutput = await exec('npm run crawl ' + 'master');

  // verify output
  expect(cliOutput).toMatch(/Looking for deprecations/i);
  expect(cliOutput).toMatch(/Adding ruid to deprecations/i);
  expect(cliOutput).toMatch(/Regenerating raw JSON/i);
  expect(cliOutput).toMatch(/Start grouping deprecations/i);
  expect(cliOutput).toMatch(/Generating markdown/i);

  // verify changes to repo
  testcases.forEach((testcase) => {
    const crawledContent = fs.readFileSync(testcase.crawled, 'utf8');
    const expectedContent = fs.readFileSync(testcase.output, 'utf8');
    expect(crawledContent).toBe(expectedContent);
  });

  // verify json
  const jsonOutput = JSON.parse(
    fs.readFileSync(
      path.join(SANDBOX_PATH, 'deprecations', 'master.json'),
      'utf8'
    )
  );

  expect(jsonOutput.deprecations).toHaveLength(14);
  expect(
    jsonOutput.deprecations.filter((d) => d.group === 'all-lowercase')
  ).toHaveLength(3);
  expect(
    jsonOutput.deprecations.filter(
      (d) => d.group === 'whitespace-normalisation'
    )
  ).toHaveLength(3);
  // BUG: this has to have 3 hits
  expect(
    jsonOutput.deprecations.filter(
      (d) => d.group === 'multiple-string-patterns-at-once'
    )
  ).toHaveLength(0);
  // BUG: this has to have 0 hits
  expect(
    jsonOutput.deprecations.filter((d) => d.group === 'catch-all')
  ).toHaveLength(3);
}, 60_000);

function exec(command) {
  return new Promise((resolve, reject) => {
    cp.exec(
      command,
      {
        cwd: SANDBOX_PATH,
        env: {
          ...process.env,
          CRAWLER_SANDBOX_MODE: 'true',
        },
      },
      (err, stdout) => {
        if (err) {
          return reject(err);
        }
        resolve(stdout.toString());
      }
    );
  });
}

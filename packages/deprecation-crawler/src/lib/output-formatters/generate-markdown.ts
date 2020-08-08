import { writeFileSync } from 'fs';
import { basename, join } from 'path';
import { CrawlConfig, Deprecation } from '../models';
import { ensureDirExists } from '../utils';
import { EOL } from 'os';
import { checkout } from "../checkout";

export async function generateTagBasedFormatter(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<void> {
  if (rawDeprecations.length === 0) {
    console.log(
      '🎉 All deprecations are resolved, no markdown have to be generated for tag based formatting'
    );
    return;
  }

  console.log('📝 Update tag-based markdown format');

  const deprecationsByGroup = rawDeprecations.reduce((acc, val) => {
    const group = val.group || '';
    acc[group] = (acc[group] || []).concat(val);
    return acc;
  }, {} as { [group: string]: Deprecation[] });

  const pagesInMd = Object.entries(deprecationsByGroup).map(
    ([deprecationGroup, groupedDeprecations]) => {
      const deprecationsByFile = groupedDeprecations.reduce((acc, val) => {
        acc[val.path] = (acc[val.path] || []).concat(val);
        return acc;
      }, {} as { [filePath: string]: Deprecation[] });

      const deprecationsOrdered = Object.entries(deprecationsByFile).map(
        ([path, deprecations]) => {
          const sorted = deprecations.sort((a, b) =>
            a.pos[0] > b.pos[0] ? 1 : -1
          );

          return ['', `### ${basename(path)}`].concat(
            ...sorted.map((deprecation) => {
              return [
                '',
                `#### ${deprecation.name} (${deprecation.kind}) {#${deprecation.ruid}}`,
                '',
                stripComment(deprecation.deprecationMessage),
                '',
                '```ts',
                deprecation.code,
                '```',
              ];
            })
          );
        }
      );

      return [`## ${deprecationGroup}`]
        .concat(...deprecationsOrdered)
        .join(EOL);
    }
  );

  const tagDate = await checkout(config);
  const markdownContent = [
    `# ${config.gitTag} (${tagDate})`,
    '',
    ...pagesInMd,
  ].join(EOL);

  ensureDirExists(config.outputDirectory);
  writeFileSync(
    join(config.outputDirectory, `${config.gitTag}.md`),
    markdownContent
  );
  console.log('Updated tag-based markdown format');
}

function stripComment(message: string) {
  return message.replace('/**', '').replace('*/', '').replace(/\*/g, '').trim();
}

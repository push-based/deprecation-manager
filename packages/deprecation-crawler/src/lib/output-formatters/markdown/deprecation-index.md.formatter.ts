import { CrawlConfig, CrawledRelease, Deprecation } from '../../models';
import { formatCode } from '../../utils';
import { writeFileSync } from 'fs';
import * as path from 'path';
import { EOL } from 'os';

export async function generateDeprecationIndex(
  config: CrawlConfig,
  crawledRelease: CrawledRelease
): Promise<void> {
  console.log('📝 Update deprecation index markdown format');

  const deprecationsByFileAndTag = crawledRelease.deprecations
    .map((d) => ({ ...d, version: d.version ? d.version : crawledRelease.tag }))
    .reduce((tags, deprecation) => {
      return {
        ...tags,
        [deprecation.version]: [
          ...(tags[deprecation.version] || []),
          deprecation,
        ],
      };
    }, {});

  const filePath = path.join(config.outputDirectory, 'deprecation-index.md');

  const newlines = '';

  const updatedSections = [
    '# Deprecations Index',
    newlines,
    await getDeprecationList(deprecationsByFileAndTag),
  ];

  const newMd = updatedSections.join(EOL + EOL) + newlines;
  writeFileSync(filePath, formatCode(newMd, 'markdown'));

  console.log('Updated group-based markdown format');
}

async function getDeprecationList(groupedDeprecations: {
  [version: string]: Deprecation[];
}): Promise<string> {
  return Object.entries(groupedDeprecations)
    .map(([version, deprecations]) => {
      const treeName = deprecations[0].version;
      const baseUrl = deprecations[0].remoteUrl.split('.git')[0];
      return (
        `- [${version}](${baseUrl}/tree${treeName}/): ` +
        EOL +
        deprecations.map((d) => `  - ${getLink(d)}`).join(EOL)
      );
    })
    .join(EOL);

  function getLink(deprecation: Deprecation): string {
    const treeName = deprecation.version;
    const baseUrl = deprecation.remoteUrl.split('.git')[0];
    return `[${deprecation.path}#L${deprecation.lineNumber}](${baseUrl}/tree${treeName}/${deprecation.path}#L${deprecation.lineNumber})`;
  }
}

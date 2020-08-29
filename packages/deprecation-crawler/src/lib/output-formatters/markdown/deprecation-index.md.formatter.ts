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

  config.groups.forEach((g) => {
    updateGroupMd(config, g, crawledRelease.deprecations);
  });

  console.log('Updated group-based markdown format');
}

export async function updateGroupMd(
  config: CrawlConfig,
  group: { key: string; matchers: string[] },
  rawDeprecations: Deprecation[]
): Promise<void> {
  const deprecationsByFileAndTag = rawDeprecations.reduce(
    (tags, deprecation) => {
      return {
        ...tags,
        [deprecation.version]: [
          ...(tags[deprecation.version] || []),
          deprecation,
        ],
      };
    },
    {}
  );

  const filePath = path.join(config.outputDirectory, 'deprecation-index.md');

  const newlines = '';

  const updatedSections = [await getDeprecationList(deprecationsByFileAndTag)];

  const newMd = updatedSections.join(EOL + EOL) + newlines;
  writeFileSync(filePath, formatCode(newMd, 'markdown'));
}

async function getDeprecationList(groupedDeprecations: {
  [version: string]: Deprecation[];
}): Promise<string> {
  return Object.entries(groupedDeprecations)
    .map(([version, deprecations]) => {
      return (
        `- ${version}: ` +
        EOL +
        deprecations.map((d) => `  - ${getLink(d)}`).join(EOL)
      );
    })
    .join(EOL);

  function getLink(deprecation: Deprecation): string {
    const treeName = deprecation.version;
    const baseUrl = deprecation.remoteUrl.split('.git')[0];
    return `${baseUrl}/tree/${treeName}/${deprecation.path}#L${deprecation.lineNumber}`;
  }
}

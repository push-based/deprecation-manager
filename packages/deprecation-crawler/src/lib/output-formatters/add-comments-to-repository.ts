import { Project } from 'ts-morph';
import { CrawlConfig, Deprecation } from '../models';
import { cwd } from 'process';
import { join } from 'path';
import { EOL } from 'os';

export async function addCommentToRepository(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<void> {
  if (rawDeprecations.length === 0) {
    console.log('🎉 All deprecations are resolved, no changes have to be made');
    return;
  }

  console.log('Writing deprecation ids to your repository...');

  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const deprecationsByFile = rawDeprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  Object.entries(deprecationsByFile).forEach(([path, deprecations]) => {
    console.log(`🔧 ${path}`);

    let addedPosForText = 0;

    const sorted = deprecations.sort((a, b) => (a.pos[0] > b.pos[0] ? 1 : -1));

    sorted.forEach((deprecation) => {
      const filePath = join(cwd(), path);

      const sourceFile = project.getSourceFile(filePath);
      const deprecationDetails = ` Details: {@link ${config.deprecationLink}#${deprecation.uuid}}`;

      const lines = deprecation.deprecationMessage.split(EOL);
      const newText = lines
        .map((comment) => addDeprecationLinkToComment(comment))
        .join(EOL);

      sourceFile.replaceText(
        deprecation.pos.map((pos) => pos + addedPosForText) as [number, number],
        newText
      );
      addedPosForText += deprecationDetails.length;

      sourceFile.saveSync();

      function addDeprecationLinkToComment(comment: string) {
        if (comment.includes(config.deprecationComment)) {
          // preserve structure of the comment
          if (comment.endsWith(' */')) {
            return comment.replace(' */', `${deprecationDetails} */`);
          }
          if (comment.endsWith('*/')) {
            return comment.replace('*/', `${deprecationDetails}*/`);
          }
          return comment + deprecationDetails;
        }
        return comment;
      }
    });
  });

  console.log(
    '🎉 All deprecations are resolved, your repository is ready for a commit!'
  );
}

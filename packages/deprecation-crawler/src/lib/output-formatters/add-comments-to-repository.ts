import { Project } from 'ts-morph';
import { CrawlConfig, Deprecation } from '../models';

export async function addCommentToRepository(
  config: CrawlConfig,
  rawDeprecations: Deprecation[]
): Promise<void> {
  if (rawDeprecations === undefined || rawDeprecations.length === 0) {
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

    // important to process deprecations based on the position
    // when a note is added, it affects the position of the next note (original position + added note length)
    const sorted = deprecations.sort((a, b) => (a.pos[0] > b.pos[0] ? 1 : -1));

    sorted.forEach((deprecation) => {
      const sourceFile = project.getSourceFile(path);
      const deprecationDetails = ` Details: {@link ${config.deprecationLink}#${deprecation.ruid}}`;

      const linkPosition = calculateLinkInsertPosition(
        deprecation,
        config,
        addedPosForText
      );

      sourceFile.insertText(linkPosition, deprecationDetails);
      addedPosForText += deprecationDetails.length;

      sourceFile.saveSync();
    });
  });

  console.log(
    '🎉 All deprecations are resolved, your repository is ready for a commit!'
  );
}

function calculateLinkInsertPosition(
  deprecation: Deprecation,
  config: CrawlConfig,
  addedPosForText: number
) {
  const positionOfDeprecatedKeyword = deprecation.deprecationMessage.indexOf(
    config.deprecationComment
  );
  const [deprecationLine] = deprecation.deprecationMessage
    .substr(positionOfDeprecatedKeyword)
    .split('\n');

  let endOfLineLength = 0;

  // preserve the structure of the comment
  if (deprecationLine.endsWith(' */')) {
    endOfLineLength = deprecationLine.length - 3;
  } else if (deprecationLine.endsWith('*/')) {
    endOfLineLength = deprecationLine.length - 2;
  } else {
    endOfLineLength = deprecationLine.length;
    if (deprecation.deprecationMessage.includes('\r\n')) {
      endOfLineLength -= 1;
    }
  }

  return (
    deprecation.pos[0] +
    positionOfDeprecatedKeyword +
    addedPosForText +
    endOfLineLength
  );
}

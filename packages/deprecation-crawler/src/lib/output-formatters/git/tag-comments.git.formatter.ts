import { Project } from 'ts-morph';
import { CrawlConfig, CrawledRelease, Deprecation } from '../../models';
import { printHeadline, printProgress, ProcessFeedback } from '../../log';
import * as kleur from 'kleur';

const feedback = getRepoSyncFeedback();
import { template } from 'lodash';
import {
  COMMENT_LINK_URL_PARAM_TOKEN,
  COMMENT_LINK_URL_TOKEN,
} from '../../constants';
import { ensureCommentLinkFormat } from '../../tasks/ensure-comment-link-template';
import { logVerbose } from '../../utils';

export async function generateTaggedCommentsInRepository(
  config: CrawlConfig,
  crawledRelease: CrawledRelease
): Promise<void> {
  ensureCommentLinkFormat(config);

  feedback.printStart(config, crawledRelease);

  const project = new Project({
    tsConfigFilePath: config.tsConfigPath,
  });

  const deprecationsByFile = crawledRelease.deprecations.reduce((acc, val) => {
    acc[val.path] = (acc[val.path] || []).concat(val);
    return acc;
  }, {} as { [filePath: string]: Deprecation[] });

  Object.entries(deprecationsByFile).forEach(([path, deprecations]) => {
    logVerbose(`🔧 ${path}`);

    let addedPosForText = 0;

    // important to process deprecations based on the position
    // when a note is added, it affects the position of the next note (original position + added note length)
    const sorted = deprecations.sort((a, b) => (a.pos[0] > b.pos[0] ? 1 : -1));

    sorted.forEach((deprecation) => {
      const sourceFile = project.getSourceFile(path);
      const commentLinkText = template(config.commentLinkFormat)({
        [COMMENT_LINK_URL_TOKEN]: config.deprecationLink,
        [COMMENT_LINK_URL_PARAM_TOKEN]: deprecation.ruid,
      });
      const deprecationDetails = ` ${commentLinkText}`;

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

  feedback.printEnd(config);
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

function getRepoSyncFeedback(): ProcessFeedback {
  return {
    printStart(config: CrawlConfig, r: CrawledRelease): void {
      printHeadline('REPOSITORY SYNC PHASE');
      console.log(
        kleur.gray(`💾 Start syncing crawled results to repository`),
        kleur.black(r.tag)
      );
      printProgress();
    },

    async printEnd(): Promise<void> {
      console.log(kleur.green(`✓  `), kleur.gray(`Repository synced!`));
    },
  };
}

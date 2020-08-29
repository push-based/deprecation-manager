import { generateDeprecationIndex } from './markdown/deprecation-index.md.formatter';
// @TODO remove imports
export { addCommentToRepository } from './git/tag-comments.git.formatter';
export {generateRawJson} from './json/raw.json.formatter';
import {generateTagBasedFormatter} from './markdown/tag-based.md-formatter';
import {generateGroupBasedFormatter} from './markdown/group-based.md.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormatter,
  groupBasedMarkdown: generateGroupBasedFormatter,
  deprecationIndex: generateDeprecationIndex,
};

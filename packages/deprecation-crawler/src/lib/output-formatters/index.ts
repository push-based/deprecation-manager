import { generateDeprecationIndex } from './markdown/deprecation-index.md.formatter';
// @TODO remove imports
import { generateTagBasedFormatter } from './generate-markdown';
import { generateGroupBasedFormatter } from './markdown/generate-group-based-formatter';

export { generateTagBasedFormatter } from './generate-markdown';
export { generateGroupBasedFormatter } from './markdown/generate-group-based-formatter';
export { addCommentToRepository } from './add-comments-to-repository';
export { generateRawJson } from './generate-raw-json';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormatter,
  groupBasedMarkdown: generateGroupBasedFormatter,
  deprecationIndex: generateDeprecationIndex,
};

import { generateDeprecationIndex } from './markdown/deprecation-index.md.formatter';
// @TODO remove imports
import {generateTagBasedFormat} from './markdown/tag-based.md-formatter';
import {generateGroupBasedFormat} from './markdown/group-based.md.formatter';


export { generateTaggedCommentsInRepository } from './git/tag-comments.git.formatter';
export {generateTagBasedFormat} from './markdown/tag-based.md-formatter';
export {generateGroupBasedFormat} from './markdown/group-based.md.formatter';
export {generateRawJson} from './json/raw.json.formatter';
export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormat,
  groupBasedMarkdown: generateGroupBasedFormat,
  deprecationIndex: generateDeprecationIndex,
};


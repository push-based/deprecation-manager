export {generateTaggedCommentsInRepository} from './git/tag-comments.git.formatter';
export {generateRawJson} from './json/raw.json.formatter';
import {generateTagBasedFormat} from './markdown/tag-based.md-formatter';
import {generateGroupBasedFormat} from './markdown/group-based.md.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormat,
  groupBasedMarkdown: generateGroupBasedFormat
}

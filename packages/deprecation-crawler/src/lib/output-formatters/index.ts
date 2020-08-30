export {addCommentToRepository} from './add-comments-to-repository';
export {generateRawJson} from './generate-raw-json';
import {generateTagBasedFormat} from './markdown/tag-based.md-formatter';
import {generateGroupBasedFormat} from './markdown/group-based.md.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormat,
  groupBasedMarkdown: generateGroupBasedFormat
}

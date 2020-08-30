export {addCommentToRepository} from './add-comments-to-repository';
export {generateRawJson} from './generate-raw-json';
import {generateTagBasedFormatter} from './markdown/tag-based.md-formatter';
import {generateGroupBasedFormatter} from './markdown/group-based.md.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormatter,
  groupBasedMarkdown: generateGroupBasedFormatter
}

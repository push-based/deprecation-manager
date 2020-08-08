export {addCommentToRepository} from './add-comments-to-repository';
export {generateRawJson} from './generate-raw-json';
import {generateTagBasedFormatter} from './generate-markdown';
import {generateGroupBasedFormatter} from './markdown/generate-group-based-formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormatter,
  groupBasedMarkdown: generateGroupBasedFormatter
}

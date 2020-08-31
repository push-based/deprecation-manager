import { generateDeprecationIndex } from './markdown/deprecation-index.md.formatter';
import { generateTagBasedFormatter } from './generate-markdown';
import { generateGroupBasedFormatter } from './markdown/generate-group-based-formatter';
export { generateTagBasedFormatter } from './generate-markdown';
export { generateGroupBasedFormatter } from './markdown/generate-group-based-formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormatter,
  groupBasedMarkdown: generateGroupBasedFormatter,
  deprecationIndex: generateDeprecationIndex,
};

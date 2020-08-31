import { generateDeprecationIndex } from './markdown/deprecation-index.md.formatter';
import { generateTagBasedFormat } from './markdown/tag-based.md-formatter';
import { generateGroupBasedFormat } from './markdown/group-based.md.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormat,
  groupBasedMarkdown: generateGroupBasedFormat,
  deprecationIndex: generateDeprecationIndex,
};

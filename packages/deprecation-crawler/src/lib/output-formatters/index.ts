import { generateGroupBasedFormat } from "./markdown/group-based.md.formatter";
import { generateTagBasedFormat } from "./markdown/tag-based.md-formatter";
import { generateDeprecationIndex } from "./markdown/deprecation-index.md.formatter";

export {generateTaggedCommentsInRepository} from './git/tag-comments.git.formatter';
export { generateRawJson } from './json/raw.json.formatter';

export const builtInFormatter = {
  tagBasedMarkdown: generateTagBasedFormat,
  groupBasedMarkdown: generateGroupBasedFormat,
  deprecationIndex: generateDeprecationIndex,
};

import { branchHasChanges } from "../utils";
import { logError } from "../log";
import { stripIndent } from "common-tags";

export async function guardAgainstDirtyRepo() {
  const isDirty = await branchHasChanges();
  if (isDirty) {
    logError(
      stripIndent`
        Repository should be clean before we ruid links can be added.
        Commit your local changes or stash them before running the deprecation-crawler.
      `
    );
    process.exit(1);
  }
}

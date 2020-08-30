import { isCrawlerModeCi } from "./utils";
import { guardAgainstDirtyRepo } from "./tasks/guard-against-dirty-repository";
import { COMMANDS, OPTIONS, setupYargsCommands } from "./commands";

(async () => {
  if (isCrawlerModeCi()) {
    await guardAgainstDirtyRepo();
  }
  const yargs = setupYargsCommands().options(OPTIONS);
  const argv = yargs.argv;

  const defaultCommand = argv._[0] === undefined;
  if (defaultCommand) {
    COMMANDS.find(c => c.command === "default-command").module.handler(argv);
  }
})();

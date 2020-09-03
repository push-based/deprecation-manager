import * as yargs from 'yargs';
import { Options } from 'yargs';
import { YargsCommandObject } from './model';

export const DEFAULT_COMMAND_NAME = 'default-command';

export function setupYargs(
  commands: YargsCommandObject[],
  options: { [key: string]: Options }
) {
  commands.forEach((command) => {
    yargs.command(command.command, command.description, command.module);
  });
  yargs.options(options).recommendCommands();

  return yargs;
}

export function runCli(
  cliCfg: {
    commands: YargsCommandObject[];
    options: { [key: string]: Options };
  },
  defaultCommand: string = DEFAULT_COMMAND_NAME
) {
  const yargs = setupYargs(cliCfg.commands, cliCfg.options);
  const argv = yargs.argv;
  const command = argv._[0] || defaultCommand;
  cliCfg.commands.find((c) => c.command === command).module.handler(argv);
}

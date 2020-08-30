import * as yargs from 'yargs';
import { Options } from 'yargs';
import { YargsCommandObject } from './model';
import { COMMANDS, OPTIONS } from '../cli-settings';

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
  const yargs = setupYargs(COMMANDS, OPTIONS);
  const argv = yargs.argv;
  const isDefaultCommand = argv._[0] === undefined;
  if (isDefaultCommand) {
    COMMANDS.find((c) => c.command === defaultCommand).module.handler(argv);
  }
}

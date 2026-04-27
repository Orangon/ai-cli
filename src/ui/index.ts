import { Command, ux } from '@oclif/core';
import 'dotenv/config';

import { translate, UnknownInputError } from '../translator';
import type { CommandLine } from '../types';

export default class DefaultCommand extends Command {
  static strict = false;

  async run(): Promise<void> {
    const userInput = this.argv.join(' ');
    let command: CommandLine;
    try {
      ux.action.start('Translating into command line');
      command = await translate(userInput);
      ux.action.stop();
      this.log(`\x1b[36m\n${command.content}\n\x1b[0m`);
      if (command.isDangerous) {
        ux.log('\x1b[41m CAUTION \x1b[0m\x1b[31m This command is dangerous!\x1b[0m');
      }
    } catch (e) {
      ux.action.stop();
      if (e instanceof UnknownInputError) {
        this.log(`\x1b[33m\n${e.message}\n\x1b[0m`);
        this.exit(1);
      } else {
        ux.error(e instanceof Error ? e.message : 'Unknown error', { exit: 500 });
      }
    }
  }
}

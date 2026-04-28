import { Command, ux } from '@oclif/core';
import 'dotenv/config';

import { loadConfig, isConfigured, setupWizard, configManager } from '../config';
import { translate, UnknownInputError } from '../translator';
import type { CommandLine } from '../types';

export default class DefaultCommand extends Command {
  static strict = false;

  static summary = 'Translate natural language into shell commands using LLM.';

  static description = `ENVIRONMENT VARIABLES
  OPENAI_API_KEY_CLI    (required) Your API key
  OPENAI_BASE_URL_CLI   (optional) Custom base URL for OpenAI-compatible API
  OPENAI_MODEL_CLI      (optional) Model name (default: deepseek-v4-flash)

EXAMPLES
  $ ai clone react from github
  $ ai delete all docker untitled images
  $ ai find all files larger than 100MB
  $ ai --config           # manage configuration
  $ ai --help             # show this help`;

  static usage = 'TEXT';

  async run(): Promise<void> {
    loadConfig();
    const args = this.argv;
    const input = args.join(' ').trim();

    if (args.includes('--config')) {
      await configManager();
      return;
    }

    if (input === '' || args.includes('-h') || args.includes('--help')) {
      this.showHelp();
      return;
    }

    if (!isConfigured()) {
      await setupWizard();
      if (!isConfigured()) return;
    }

    let command: CommandLine;
    try {
      ux.action.start('Translating into command line');
      command = await translate(input);
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

  private showHelp(): void {
    const ctor = this.constructor as typeof DefaultCommand;
    this.log(`USAGE
  $ ai <text>

${ctor.summary}

${ctor.description}
`);
  }
}

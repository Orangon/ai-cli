import { createChatCompletion } from '../open-ai';
import { generatePromptMessages } from '../prompt';
import type { CommandLine } from '../types';

export class UnknownInputError extends Error {
  constructor() {
    super(
      'Cannot translate your input into a command.\n' +
        'Please provide more details, e.g. table name, column, value, condition, etc.\n' +
        'Example: "update users table set name to john where id is 1 in postgresql"',
    );
    this.name = 'UnknownInputError';
  }
}

export async function translate(input: string): Promise<CommandLine> {
  const inputMessages = await generatePromptMessages(input);
  const outputMessage = await createChatCompletion(inputMessages);

  if (outputMessage.trim() === 'UNKNOWN') {
    throw new UnknownInputError();
  }

  let content = outputMessage;
  let isDangerous = false;
  if (outputMessage.endsWith('\nDANGEROUS')) {
    isDangerous = true;
    content = outputMessage.slice(0, -10);
  }
  if (content.startsWith('>')) {
    return { content: content.slice(1), isDangerous };
  }
  throw new Error('Failed to translate the command.');
}

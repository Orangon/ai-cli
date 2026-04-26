import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as readline from 'node:readline';
import * as stream from 'node:stream';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import type { PromptTemplate } from '../types';

type Role = 'user' | 'assistant' | 'system';

interface DraftMessage {
  role: Role;
  content: string;
}

export async function loadPromptTemplate(path: string) {
  return new Promise<PromptTemplate>(async (resolve) => {
    const drafts: DraftMessage[] = [];
    const saveCurrentMessage = () => {
      if (currentDraft) {
        currentDraft.content = currentDraft.content.trim();
        currentDraft.content = currentDraft.content.replace('${OS}', os.platform());
        drafts.push(currentDraft);
        currentDraft = null;
      }
    };

    const buffer = await fs.readFile(path);
    const bufferStream = new stream.PassThrough({ encoding: 'utf-8' });
    bufferStream.end(buffer);

    const rl = readline.createInterface({ input: bufferStream });
    let currentDraft: DraftMessage | null = null;
    rl.on('line', (line) => {
      if (line.startsWith('# ')) {
        saveCurrentMessage();
        currentDraft = {
          role: line.substring(2).trim().toLowerCase() as Role,
          content: '',
        };
      } else if (currentDraft) {
        const text = line.trim();
        if (text !== '') {
          currentDraft.content += line + '\n';
        }
      }
    });
    rl.on('close', () => {
      saveCurrentMessage();
      const messages: ChatCompletionMessageParam[] = drafts.map((d) => ({ role: d.role, content: d.content }));
      resolve({ messages });
    });
  });
}

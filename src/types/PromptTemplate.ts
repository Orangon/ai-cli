import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface PromptTemplate {
  messages: ChatCompletionMessageParam[];
}

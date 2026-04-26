import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const apiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_CLI,
  baseURL: process.env.OPENAI_BASE_URL_CLI,
});

export async function createChatCompletion(messages: ChatCompletionMessageParam[]): Promise<string> {
  const response = await apiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL_CLI ?? 'gpt-3.5-turbo',
    temperature: 0,
    messages,
  });
  const firstMessage = response.choices[0]?.message;
  if (firstMessage) {
    return firstMessage.content ?? '';
  }
  throw new Error('Failed to get response from OpenAI service.');
}

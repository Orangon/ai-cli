import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

let apiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!apiClient) {
    apiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_CLI,
      baseURL: process.env.OPENAI_BASE_URL_CLI,
    });
  }
  return apiClient;
}

export async function createChatCompletion(messages: ChatCompletionMessageParam[]): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL_CLI ?? 'deepseek-v4-flash',
    temperature: 0,
    messages,
  });
  const firstMessage = response.choices[0]?.message;
  if (firstMessage) {
    return firstMessage.content ?? '';
  }
  throw new Error('Failed to get response from OpenAI service.');
}

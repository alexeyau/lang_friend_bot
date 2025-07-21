import axios from "axios";
import { getPrompt, Message } from './helpers';

const model = 'accounts/fireworks/models/deepseek-v3';

type Responce = {
    choices: {
        text: string;
    }[],
};

export async function requestGpt(userText: string | null, messages: Message[], fireworksApiKey: string): Promise<Responce> {
  console.log(' >>> ', getPrompt(userText, messages));
  const response = await axios.post(
    'https://api.fireworks.ai/inference/v1/completions',
    {
      model: model,
      prompt: getPrompt(userText, messages),
      max_tokens: 400,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    },
    {
      headers: {
        'Authorization': `Bearer ${fireworksApiKey}`
      }
    },
  );
  return response.data;
}

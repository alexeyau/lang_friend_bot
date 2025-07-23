import axios from "axios";
import { getPrompt, Message } from './helpers';

// accounts/fireworks/models/deepseek-v3
//accounts/fireworks/models/deepseek-r1-0528 - bad
// accounts/fireworks/models/llama4-maverick-instruct-basic better but continuing
// accounts/fireworks/models/deepseek-r1 almost ok
const model = 'accounts/fireworks/models/deepseek-v3';

type Responce = {
    choices: {
        text: string;
    }[],
};

export async function requestGpt(
  userText: string | null,
  messages: Message[],
  fireworksApiKey: string,
  language: string,
): Promise<Responce> {
  // console.log(' промт >>> ', getPrompt(userText, messages, language));
  const response = await axios.post(
    'https://api.fireworks.ai/inference/v1/completions',
    {
      model: model,
      prompt: getPrompt(userText, messages, language),
      max_tokens: userText ? 400 : 200,
      temperature: 0.6,
      top_p: 0.8,
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

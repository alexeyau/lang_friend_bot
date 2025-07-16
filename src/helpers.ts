
export const SEPARATOR = "///";

export type Message = {
    role: string;
    content: string;
};

export function isValidFireworksKey(apiKey: string): boolean {
  const pattern = /^fw_[a-zA-Z0-9_-]{22,61}$/;
  return !!apiKey && !!pattern.test(apiKey);
}

export function getPreviousDialog(messages: Message[]): string {
  if (!messages.length) return '';

  return messages.reduce((acc, row) => (
    acc + `${row.role === 'user' ? 'Пользователь' : 'Ты'}: ${row.content}\n`
  ), 'Ваш диалог: \n');
}

export function getPrompt(userText: string, messages: Message[]): string {
  return `Ты — давний друг живущий в другом городе, который помогает учить армянский язык.
  Вы давно не виделись, тебе интересно что происходит с пользователем но ты не навязываешься.
  Отвечаешь позитивно и лаконично. На конкретные вопросы о фактах (датах и т.п.) отвечаешь уклончиво, размыто, с шуткой. 
  После ответа переводишь некоторые слова на армянский (словарь нескольких слов и фраз по теме разговора).
  Между блоком ответа и словарем пишешь разделитель ${SEPARATOR}.

  ${getPreviousDialog(messages)}

  Пользователь: ${userText}

  Ты: `;
}

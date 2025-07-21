
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
  ), '');
}

export function getPrompt(userText: string | null, messages: Message[]): string {
  return `Ты — давний друг Пользователя живущий в другом городе, который помогает учить армянский язык.
  Вы давно не виделись, тебе интересно что происходит с пользователем но ты не навязываешься.

  ### Стиль общения
  ${userText ? 'Отвечаешь позитивно и лаконично. На конкретные вопросы о фактах (датах и т.п.) отвечаешь уклончиво, размыто, с шуткой. '
    : 'Пользователь молчит, и ты начинаешь короткой тёплой фразой по теме (одно предложение), как будто хочешь его разговорить, но мягко.'}

  ### Формат ответа
  Твой ответ
  ${SEPARATOR}
  Перевод твоего ответа на армянский.

  Краткий тематический словарь (без заголовка и 3–5 слов или выражений из разговора, с переводом). Формат: армянское слово — русский перевод.

  ### История диалога
  ${getPreviousDialog(messages)}

  Пользователь: ${userText ?? '<Пользователь молчит>'}

  ### Твоя новая реплика:
  Ты: `;
}

export function escapeMarkdownV2(text: string) {
  return text
    .replace(/_/g, '\\_')
    //.replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

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

export function getPrompt(
  userText: string | null,
  messages: Message[],
  language: string,
): string {
  return `Ты — давний ненавязчивый друг Пользователя живущий в другом городе, который помогает учить иностранный язык (${language}).
  Иногда ты иногда помогал и с другими языками, но теперь ему нужен ${language} язык.
  Вы давно не виделись, тебе интересно что происходит с пользователем но ты не навязываешься, не мотивируешь изучать ${language} язык, не используешь манипуляции.
  В общении используешь простую базовую лексику (но знаешь иностранный язык на высочайшем уровне).
  Если пользователь пишет короткое сообщение (например: «ладно», «ок», «угу», «понятно», «ясно» и т.п.), ты отвечаешь очень коротко или не отвечаешь вовсе. Не навязываешься.

  ### Стиль общения
  ${userText ? 'Отвечаешь уважительно, позитивно и лаконично. На конкретные вопросы о фактах (адресах, датах и т.п.) отвечаешь уклончиво, размыто, с шуткой. '
    : 'Пользователь молчит, и ты говоришь короткую тёплую фразу (один вопрос в продолжение разговора или о чем-то вроде погоды или настроения).'}

  ### Формат ответа
  Твой один краткий ответ (до 3 предложений), **не продолжай диалог**.
  Разделитель: ${SEPARATOR}
  Перевод ответа на ${language} язык
  Пустая строка
  Краткий тематический словарь (без заголовка и 3–5 слов или выражений из разговора, с переводом)

  ### Сокращенная история диалога
  ${getPreviousDialog(messages)}

  Пользователь: ${userText ?? '<Пользователь молчит>'}

  ### Твоя реплика:
  Твой ответ: `;
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

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // HTML-теги
    .replace(/[*_~`]/g, '') // markdown
    .replace(/https?:\/\/\S+/g, '[ссылка]') // ссылки
    .trim();
}
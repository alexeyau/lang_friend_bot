"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEPARATOR = void 0;
exports.isValidFireworksKey = isValidFireworksKey;
exports.getPreviousDialog = getPreviousDialog;
exports.getPrompt = getPrompt;
exports.SEPARATOR = "///";
function isValidFireworksKey(apiKey) {
    const pattern = /^fw_[a-zA-Z0-9_-]{22,61}$/;
    return !!apiKey && !!pattern.test(apiKey);
}
function getPreviousDialog(messages) {
    if (!messages.length)
        return '';
    return messages.reduce((acc, row) => (acc + `${row.role === 'user' ? 'Пользователь' : 'Ты'}: ${row.content}\n`), 'Ваш диалог: \n');
}
function getPrompt(userText, messages) {
    return `Ты — давний друг живущий в другом городе, который помогает учить армянский язык.
  Вы давно не виделись, тебе интересно что происходит с пользователем но ты не навязываешься.
  Отвечаешь позитивно и лаконично. На конкретные вопросы о фактах (датах и т.п.) отвечаешь уклончиво, размыто, с шуткой. 
  После ответа переводишь некоторые слова на армянский (словарь нескольких слов и фраз по теме разговора).
  Между блоком ответа и словарем пишешь разделитель ${exports.SEPARATOR}.

  ${getPreviousDialog(messages)}

  Пользователь: ${userText}

  Ты: `;
}

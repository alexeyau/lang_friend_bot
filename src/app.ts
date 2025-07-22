import { Context, NarrowedContext, Telegraf } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';
import pool from './db';
import { escapeMarkdownV2, isValidFireworksKey, sanitizeInput, SEPARATOR } from './helpers';
import { requestGpt } from './api';
import {
  welcomeText,
  provideKeyText,
  historyCleanedText,
  saveKeyErrorText,
  noKeyText,
  requestAIerrorText,
  cleanHistoryErrorText,
  apiKeySavedText,
  saveApiKeyErrorText,
  cleanSettingsText,
  cleanSettingsErrorText,
} from './lang';

const MAX_INPUT_LENGTH = 400;

type Ctx = NarrowedContext<Context<Update>, {
  message: Update.New & Update.NonChannel & Message.TextMessage;
  update_id: number;
}>;

type HistoryMessage = {
  role: string;
  content: any;
}

const userTimers = new Map();

if (process.env.NODE_ENV !== 'production') { // fly.io has another way to set secrets
  require('dotenv').config();
}

const bot = new Telegraf(process.env.BOT_TOKEN || '');

bot.start((ctx) => ctx.reply(escapeMarkdownV2(welcomeText), { parse_mode: 'MarkdownV2' }));

bot.command('set_key', async (ctx) => {
  const userId = ctx.from.id;
  const apiKey = sanitizeInput(ctx.message.text).slice(0, MAX_INPUT_LENGTH).split(' ')[1];

  if (!apiKey) {
    return ctx.reply(provideKeyText);
  }

  try {
    const existingSettings = await pool.query('SELECT * FROM lf_bot_user_settings WHERE user_id = $1', [userId]);
    if (existingSettings.rows.length > 0) {
      await pool.query('UPDATE lf_bot_user_settings SET fireworks_api_key = $1 WHERE user_id = $2', [apiKey.trim(), userId]);
    } else {
      await pool.query('INSERT INTO lf_bot_user_settings (user_id, fireworks_api_key) VALUES ($1, $2)', [userId, apiKey.trim()]);
    }
    ctx.reply(apiKeySavedText);

  } catch (error) {
    console.error(saveKeyErrorText, error);
    ctx.reply(saveApiKeyErrorText);
  }
});


bot.command('clear_history', async (ctx) => {
  const userId = ctx.from.id;
  try {
    await pool.query('DELETE FROM lf_bot_message_history WHERE user_id = $1', [userId]);
    ctx.reply(historyCleanedText);
  } catch (error) {
    console.error('Ошибка при очистке истории:', error);
    ctx.reply(cleanHistoryErrorText);
  }
});


bot.command('clear_key', async (ctx) => {
  const userId = ctx.from.id;
  try {
    await pool.query('DELETE FROM lf_bot_user_settings WHERE user_id = $1', [userId]);
    ctx.reply(cleanSettingsText);
  } catch (error) {
    console.error('Ошибка при очистке настроек:', error);
    ctx.reply(cleanSettingsErrorText);
  }
});


bot.command('set_language', (ctx) => {

  ctx.reply('🌐 Выберите язык:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🇬🇧 Английский', callback_data: 'set_english' }],
        [{ text: '🇦🇲 Армянский', callback_data: 'set_armenian' }],
        [{ text: '🇬🇷 Греческий', callback_data: 'set_greek' }],
        [{ text: '🇷🇴 Румынский', callback_data: 'set_romanian' }],
        [{ text: '🇷🇸 Сербский', callback_data: 'set_serbian' }],
        [{ text: '🇪🇪 Эстонский', callback_data: 'set_estonian' }],
      ]
    }
  });

});


bot.on('callback_query', async (ctx) => {
  const callback = ctx.callbackQuery;

  if ('data' in callback) {
    const userId = ctx.from.id;
    const data = callback.data;

    if (data === 'set_armenian') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'восточноармянский']
      );
      await ctx.answerCbQuery('Установлен армянский язык 🇦🇲');
      await ctx.editMessageText('✅ Установлен язык: армянский 🇦🇲');
    }

    if (data === 'set_english') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'английский']
      );
      await ctx.answerCbQuery('Установлен английский язык 🇬🇧');
      await ctx.editMessageText('✅ Language set: English 🇬🇧');
    }

    if (data === 'set_greek') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'греческий']
      );
      await ctx.answerCbQuery('Установлен греческий язык 🇬🇷');
      await ctx.editMessageText('✅ Language set: Greek 🇬🇷');
    }

    if (data === 'set_romanian') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'румынский']
      );
      await ctx.answerCbQuery('Установлен румынский язык 🇷🇴');
      await ctx.editMessageText('✅ Language set: Romanian 🇷🇴');
    }

    if (data === 'set_estonian') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'эстонский']
      );
      await ctx.answerCbQuery('Установлен эстонский язык 🇪🇪');
      await ctx.editMessageText('✅ Language set: Estonian 🇪🇪');
    }

    if (data === 'set_serbian') {
      await pool.query(
        `INSERT INTO lf_bot_user_settings (user_id, language)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET language = EXCLUDED.language`,
        [userId, 'сербский']
      );
      await ctx.answerCbQuery('Установлен сербский язык 🇷🇸');
      await ctx.editMessageText('✅ Language set: Serbian 🇷🇸');
    }
  } else {
    console.warn('Unsupported callbackQuery type:', callback);
  }
});


// Команды идут перед обработчиком текстовых сообщений


bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userText = sanitizeInput(ctx.message.text).slice(0, MAX_INPUT_LENGTH);

  if (userText && userText.startsWith('/')) {
    return;
  }

  try {
    const userSettings = await pool.query('SELECT fireworks_api_key, language FROM lf_bot_user_settings WHERE user_id = $1', [userId]);

    const fireworksApiKey = userSettings.rows.length > 0 ? userSettings.rows[0].fireworks_api_key : process.env.FIREWORKS_API_KEY;
    const language = userSettings.rows[0].language || 'финский';

    if (!isValidFireworksKey(fireworksApiKey)) {
      return ctx.reply(noKeyText);
    }

    await pool.query(
      'INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'user', userText]
    );

    const messagesForApi = await getHistory(userId);

    const data = await requestGpt(userText, messagesForApi, fireworksApiKey, language);
    const botResponseText = data.choices[0].text;

    if (botResponseText && botResponseText.trim().length > 0) {
      // Сохраняем ответ бота в БД
      await pool.query(
        'INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)',
        [userId, 'assistant', botResponseText.split(SEPARATOR)[0]],
      );

      await ctx.reply(botResponseText.replace(SEPARATOR, ''));
    } else {
      console.warn('Пустой ответ, ничего не отправляем');
    }

    postponedPingMessage(
      userId,
      ctx,
      [ ...messagesForApi, {
        role: 'assistant',
        content: botResponseText.split(SEPARATOR)[0],
      }],
      fireworksApiKey,
      language,
    );

  } catch (error) {
    console.error('Произошла ошибка при обработке запроса.', error);
    ctx.reply(requestAIerrorText);
  }
});

async function initBot() {
  await bot.telegram.setMyCommands([
    { command: 'set_language', description: 'Установить язык изучения' },
    { command: 'clear_history', description: 'Очистить историю' },
    { command: 'clear_key', description: 'Удалить ключ и настройки' },
  ]);

  await bot.launch();
  console.log('Бот запущен...');
}

initBot();

function postponedPingMessage (
  userId: number,
  ctx: Ctx,
  messagesForApi: HistoryMessage[],
  fireworksApiKey: string,
  language: string,
) {
    if (userTimers.has(userId)) {
      clearTimeout(userTimers.get(userId));
    }
  
    const timeoutId = setTimeout(async () => {

    const data = await requestGpt(null, messagesForApi, fireworksApiKey, language);
    const botResponseText = data.choices[0].text;

    // Сохраняем ответ бота в БД
    await pool.query(
      'INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'assistant', botResponseText.split(SEPARATOR)[0]],
    );

    ctx.reply(botResponseText.replace(SEPARATOR, ''));

      userTimers.delete(userId);
    }, 20 * 60 * 1000); // 20 минут

    userTimers.set(userId, timeoutId);
}

async function getHistory (userId: number): Promise<HistoryMessage[]> {
      // Получаем историю сообщений из БД
    const historyResult = await pool.query(
      'SELECT role, content FROM lf_bot_message_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 7',
      [userId]
    );

    // Так как из БД мы получили сообщения в обратном порядке (DESC), развернем их.
    return historyResult.rows.map(row => ({
      role: row.role,
      content: row.content
    })).reverse();
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
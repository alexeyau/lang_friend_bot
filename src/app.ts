import { Telegraf } from 'telegraf';
import pool from './db';
import { isValidFireworksKey, SEPARATOR } from './helpers';
import { requestGpt } from './api';
import {
  welcomeText,
  provideKeyText,
  historyCleanedText,
  saveKeyErrorText,
  noKeyText,
  requestAIerrorText,
 } from './lang';

if (process.env.NODE_ENV !== 'production') { // fly.io has another way to set secrets
  require('dotenv').config();
}

const bot = new Telegraf(process.env.BOT_TOKEN || '');

bot.start((ctx) => ctx.reply(welcomeText));

bot.command('set_key', async (ctx) => {
  const userId = ctx.from.id;
  const apiKey = ctx.message.text.split(' ')[1];

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
    ctx.reply('Твой API ключ от Fireworks AI сохранен!');
  } catch (error) {
    console.error(saveKeyErrorText, error);
    ctx.reply('Произошла ошибка при сохранении ключа.');
  }
});

bot.command('clear', async (ctx) => {
  const userId = ctx.from.id;
  try {
    await pool.query('DELETE FROM lf_bot_message_history WHERE user_id = $1', [userId]);
    ctx.reply(historyCleanedText);
  } catch (error) {
    console.error('Ошибка при очистке истории:', error);
    ctx.reply('Произошла ошибка при очистке истории.');
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userText = ctx.message.text;

  if (userText && userText.startsWith('/')) {
    return;
  }

  try {
    const userSettings = await pool.query('SELECT fireworks_api_key FROM lf_bot_user_settings WHERE user_id = $1', [userId]);

    const fireworksApiKey = userSettings.rows.length > 0 ? userSettings.rows[0].fireworks_api_key : process.env.FIREWORKS_API_KEY;

    if (!isValidFireworksKey(fireworksApiKey)) {
      return ctx.reply(noKeyText);
    }

    await pool.query(
      'INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'user', userText]
    );

    // Получаем историю сообщений из БД
    // (берем последние N сообщений, чтобы не превышать лимиты токенов)
    const historyResult = await pool.query(
      'SELECT role, content FROM lf_bot_message_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
      [userId]
    );
      
    // Формируем массив сообщений для API.
    // Так как из БД мы получили сообщения в обратном порядке (DESC), развернем их.
    const messagesForApi = historyResult.rows.map(row => ({
      role: row.role,
      content: row.content
    })).reverse();

    const data = await requestGpt(userText, messagesForApi, fireworksApiKey);
    const botResponseText = data.choices[0].text;

    // Сохраняем ответ бота в БД
    await pool.query(
      'INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)',
      [userId, 'assistant', botResponseText.split(SEPARATOR)[0]],
    );

    ctx.reply(botResponseText);

  } catch (error) {
    console.error('Произошла ошибка при обработке запроса.', error);
    ctx.reply(requestAIerrorText);
  }
});

bot.launch();

console.log('Бот запущен...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
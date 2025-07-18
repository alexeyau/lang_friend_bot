import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import pool, { createMessageHistoryTable, createUserSettingsTable } from './db';
import axios from 'axios';
import { getPrompt, isValidFireworksKey, SEPARATOR } from './helpers';
import { requestGpt } from './api';

console.log(">>> NODE_ENV:", process.env.NODE_ENV);

if (process.env.NODE_ENV !== 'production') { // fly.io has another way to set secrets
  require('dotenv').config();
}

console.log(">>> BOT_TOKEN:", process.env.BOT_TOKEN);

const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Создаем таблицы при запуске бота
createUserSettingsTable();
createMessageHistoryTable();

bot.start((ctx) => ctx.reply('Привет! Я бот, использующий нейросеть Deepseek. Отправь мне /set_key <твой_ключ_fireworks_ai> для сохранения твоего ключа.'));

bot.command('set_key', async (ctx) => {
  const userId = ctx.from.id;
  const apiKey = ctx.message.text.split(' ')[1];

  if (!apiKey) {
    return ctx.reply('Пожалуйста, укажи свой API ключ после команды /set_key');
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
    console.error('Ошибка при сохранении ключа:', error);
    ctx.reply('Произошла ошибка при сохранении ключа.');
  }
});

// Новая команда для очистки истории
bot.command('clear', async (ctx) => {
  const userId = ctx.from.id;
  try {
    await pool.query('DELETE FROM lf_bot_message_history WHERE user_id = $1', [userId]);
    ctx.reply('История общения очищена!');
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
      return ctx.reply('API ключ для Fireworks AI не найден. Пожалуйста, установи его с помощью команды /set_key или убедись, что он задан в .env файле.');
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
    console.error('Ошибка при запросе к Fireworks AI:', error);
    ctx.reply('Произошла ошибка при обработке твоего запроса.');
  }
});

bot.launch();

console.log('Бот запущен...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
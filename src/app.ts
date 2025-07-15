import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import pool, { createUserSettingsTable } from './db';
import axios from 'axios';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN || '');

// Создаем таблицу при запуске бота
createUserSettingsTable();

bot.start((ctx) => ctx.reply('Привет! Я бот, использующий нейросеть Deepseek. Отправь мне /set_key <твой_ключ_fireworks_ai> для сохранения твоего ключа.'));

bot.command('set_key', async (ctx) => {
  const userId = ctx.from.id;
  const apiKey = ctx.message.text.split(' ')[1];

  if (!apiKey) {
    return ctx.reply('Пожалуйста, укажи свой API ключ после команды /set_key.');
  }

  try {
    const existingSettings = await pool.query('SELECT * FROM lf_bot_user_settings WHERE user_id = $1', [userId]);
    if (existingSettings.rows.length > 0) {
      await pool.query('UPDATE lf_bot_user_settings SET fireworks_api_key = $1 WHERE user_id = $2', [apiKey, userId]);
    } else {
      await pool.query('INSERT INTO lf_bot_user_settings (user_id, fireworks_api_key) VALUES ($1, $2)', [userId, apiKey]);
    }
    ctx.reply('Твой API ключ от Fireworks AI сохранен!');
  } catch (error) {
    console.error('Ошибка при сохранении ключа:', error);
    ctx.reply('Произошла ошибка при сохранении ключа.');
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userText = ctx.message.text;

  try {
    const userSettings = await pool.query('SELECT fireworks_api_key FROM lf_bot_user_settings WHERE user_id = $1', [userId]);

    const fireworksApiKey = userSettings.rows.length > 0 ? userSettings.rows[0].fireworks_api_key : process.env.FIREWORKS_API_KEY;

    if (!fireworksApiKey) {
      return ctx.reply('API ключ для Fireworks AI не найден. Пожалуйста, установи его с помощью команды /set_key или убедись, что он задан в .env файле.');
    }

    const response = await axios.post('https://api.fireworks.ai/inference/v1/chat/completions', {
      model: 'accounts/fireworks/models/deepseek-chat',
      messages: [
        {
          role: 'user',
          content: userText,
        },
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${fireworksApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    ctx.reply(response.data.choices[0].message.content);

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
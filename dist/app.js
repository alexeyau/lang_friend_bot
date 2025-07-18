"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const db_1 = __importStar(require("./db"));
const helpers_1 = require("./helpers");
const api_1 = require("./api");
console.log(">>> NODE_ENV:", process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') { // fly.io has another way to set secrets
    require('dotenv').config();
}
console.log(">>> BOT_TOKEN:", process.env.BOT_TOKEN);
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN || '');
// Создаем таблицы при запуске бота
(0, db_1.createUserSettingsTable)();
(0, db_1.createMessageHistoryTable)();
bot.start((ctx) => ctx.reply('Привет! Я бот, использующий нейросеть Deepseek. Отправь мне /set_key <твой_ключ_fireworks_ai> для сохранения твоего ключа.'));
bot.command('set_key', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = ctx.from.id;
    const apiKey = ctx.message.text.split(' ')[1];
    if (!apiKey) {
        return ctx.reply('Пожалуйста, укажи свой API ключ после команды /set_key');
    }
    try {
        const existingSettings = yield db_1.default.query('SELECT * FROM lf_bot_user_settings WHERE user_id = $1', [userId]);
        if (existingSettings.rows.length > 0) {
            yield db_1.default.query('UPDATE lf_bot_user_settings SET fireworks_api_key = $1 WHERE user_id = $2', [apiKey.trim(), userId]);
        }
        else {
            yield db_1.default.query('INSERT INTO lf_bot_user_settings (user_id, fireworks_api_key) VALUES ($1, $2)', [userId, apiKey.trim()]);
        }
        ctx.reply('Твой API ключ от Fireworks AI сохранен!');
    }
    catch (error) {
        console.error('Ошибка при сохранении ключа:', error);
        ctx.reply('Произошла ошибка при сохранении ключа.');
    }
}));
// Новая команда для очистки истории
bot.command('clear', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = ctx.from.id;
    try {
        yield db_1.default.query('DELETE FROM lf_bot_message_history WHERE user_id = $1', [userId]);
        ctx.reply('История общения очищена!');
    }
    catch (error) {
        console.error('Ошибка при очистке истории:', error);
        ctx.reply('Произошла ошибка при очистке истории.');
    }
}));
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = ctx.from.id;
    const userText = ctx.message.text;
    if (userText && userText.startsWith('/')) {
        return;
    }
    try {
        const userSettings = yield db_1.default.query('SELECT fireworks_api_key FROM lf_bot_user_settings WHERE user_id = $1', [userId]);
        const fireworksApiKey = userSettings.rows.length > 0 ? userSettings.rows[0].fireworks_api_key : process.env.FIREWORKS_API_KEY;
        if (!(0, helpers_1.isValidFireworksKey)(fireworksApiKey)) {
            return ctx.reply('API ключ для Fireworks AI не найден. Пожалуйста, установи его с помощью команды /set_key или убедись, что он задан в .env файле.');
        }
        yield db_1.default.query('INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)', [userId, 'user', userText]);
        // Получаем историю сообщений из БД
        // (берем последние N сообщений, чтобы не превышать лимиты токенов)
        const historyResult = yield db_1.default.query('SELECT role, content FROM lf_bot_message_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10', [userId]);
        // Формируем массив сообщений для API.
        // Так как из БД мы получили сообщения в обратном порядке (DESC), развернем их.
        const messagesForApi = historyResult.rows.map(row => ({
            role: row.role,
            content: row.content
        })).reverse();
        const data = yield (0, api_1.requestGpt)(userText, messagesForApi, fireworksApiKey);
        const botResponseText = data.choices[0].text;
        // Сохраняем ответ бота в БД
        yield db_1.default.query('INSERT INTO lf_bot_message_history (user_id, role, content) VALUES ($1, $2, $3)', [userId, 'assistant', botResponseText.split(helpers_1.SEPARATOR)[0]]);
        ctx.reply(botResponseText);
    }
    catch (error) {
        console.error('Ошибка при запросе к Fireworks AI:', error);
        ctx.reply('Произошла ошибка при обработке твоего запроса.');
    }
}));
bot.launch();
console.log('Бот запущен...');
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

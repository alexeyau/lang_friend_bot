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
exports.createMessageHistoryTable = exports.createUserSettingsTable = void 0;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
// lf_bot_user_settings
//     user_id
//     fireworks_api_key
// lf_bot_message_history
//     id
//     user_id
//     role
//     content
//     timestamp
const createUserSettingsTable = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    CREATE TABLE IF NOT EXISTS lf_bot_user_settings (
      user_id BIGINT PRIMARY KEY,
      fireworks_api_key VARCHAR(255)
    );
  `;
    try {
        yield pool.query(query);
        console.log('Таблица lf_bot_user_settings успешно создана или уже существует.');
    }
    catch (error) {
        console.error('Ошибка при создании таблицы lf_bot_user_settings:', error);
    }
});
exports.createUserSettingsTable = createUserSettingsTable;
const createMessageHistoryTable = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = `
    CREATE TABLE IF NOT EXISTS lf_bot_message_history (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      role VARCHAR(10) NOT NULL, -- 'user' или 'assistant'
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;
    try {
        yield pool.query(query);
        console.log('Таблица lf_bot_message_history успешно создана или уже существует.');
    }
    catch (error) {
        console.error('Ошибка при создании таблицы lf_bot_message_history:', error);
    }
});
exports.createMessageHistoryTable = createMessageHistoryTable;
exports.default = pool;

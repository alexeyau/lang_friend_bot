import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
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

export const createUserSettingsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS lf_bot_user_settings (
      user_id BIGINT PRIMARY KEY,
      fireworks_api_key VARCHAR(255)
    );
  `;
  try {
    await pool.query(query);
    console.log('Таблица lf_bot_user_settings успешно создана или уже существует.');
  } catch (error) {
    console.error('Ошибка при создании таблицы lf_bot_user_settings:', error);
  }
};

export const createMessageHistoryTable = async () => {
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
    await pool.query(query);
    console.log('Таблица lf_bot_message_history успешно создана или уже существует.');
  } catch (error) {
    console.error('Ошибка при создании таблицы lf_bot_message_history:', error);
  }
};

export default pool;
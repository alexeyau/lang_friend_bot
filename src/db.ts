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

export default pool;
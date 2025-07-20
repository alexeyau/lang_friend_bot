/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('lf_bot_message_history', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'bigint', notNull: true },
    role: { type: 'varchar(10)', notNull: true }, // 'user' | 'assistant'
    content: { type: 'text', notNull: true },
    timestamp: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('lf_bot_message_history');
};

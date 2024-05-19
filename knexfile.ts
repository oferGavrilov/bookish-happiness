require('dotenv').config();

import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    extension: 'ts',
    tableName: 'knex_migrations',
  },
};

export default config;

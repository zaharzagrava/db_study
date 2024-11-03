/* eslint-disable */
require('dotenv').config();

const dbConfig = {
  ...(() => {
    const isRemote = process.env.IS_REMOTE;

    if(process.env.IS_SCRIPT) {
      return {
        username: process.env.SCRIPT_DB_USER,
        password: process.env.SCRIPT_DB_PASSWORD,
        database: process.env.SCRIPT_DB_DATABASE,
        host: process.env.SCRIPT_DB_HOST,
        port: process.env.SCRIPT_DB_PORT,
        ...(isRemote && process.env.DB_TO_MIGRATE === 'postgres' && {
          dialectOptions: {
            ssl: {
              require: true, // This will help you. But you will see nwe error
              rejectUnauthorized: false, // This line will fix new error
            },
          },
        }),
        dialect: process.env.DB_TO_MIGRATE,
      };
    }

    if (process.env.DB_TO_MIGRATE === 'postgres') {
      return {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        ...(isRemote && {
          dialectOptions: {
            ssl: {
              require: true, // This will help you. But you will see nwe error
              rejectUnauthorized: false, // This line will fix new error
            },
          },
        }),
        dialect: 'postgres',
      };
    } else if (process.env.DB_TO_MIGRATE === 'mysql') {
      return {
        username: process.env.MY_SQL_DB_USERNAME,
        password: process.env.MY_SQL_DB_PASSWORD,
        database: process.env.MY_SQL_DB_NAME,
        host: process.env.MY_SQL_DB_HOST,
        port: process.env.MY_SQL_DB_PORT,
        dialect: 'mysql',
      };
    } else if (process.env.DB_TO_MIGRATE === 'mssql') {
      return {
        username: process.env.MS_SQL_DB_USERNAME,
        password: process.env.MS_SQL_DB_PASSWORD,
        database: process.env.MS_SQL_DB_NAME,
        host: process.env.MS_SQL_DB_HOST,
        port: process.env.MS_SQL_DB_PORT,
        dialect: 'mssql',
      };
    } else if (process.env.DB_TO_MIGRATE === 'oracle') {
      return {
        username: process.env.ORACLE_DB_USERNAME,
        password: process.env.ORACLE_DB_PASSWORD,
        database: process.env.ORACLE_DB_NAME,
        host: process.env.ORACLE_DB_HOST,
        port: process.env.ORACLE_DB_PORT,
        dialect: 'oracle',
      };
    } else if (process.env.DB_TO_MIGRATE === 'mariadb') {
      return {
        username: process.env.MARIA_DB_USERNAME,
        password: process.env.MARIA_DB_PASSWORD,
        database: process.env.MARIA_DB_NAME,
        host: process.env.MARIA_DB_HOST,
        port: process.env.MARIA_DB_PORT,
        dialect: 'mariadb',
      };
    }
  })(),
  logging: true,
};

module.exports = {
  local: dbConfig,
  development: dbConfig,
  test: {
    username: 'postgres',
    password: 'Password123!',
    database: 'db_study_test',
    host: 'localhost',
    port: 5430,
    dialect: 'postgres',
    logging: true,
  },
  preprod: dbConfig,
  production: dbConfig,
  staging: dbConfig,
};

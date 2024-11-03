import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApiConfigModule } from './api-config/api-config.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiConfigService } from './api-config/api-config.service';
import { LoggerModule } from './logger/logger.module';
import { AllExceptionsFilter } from './exceptions-filter/exceptions-filter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { UtilsModule } from './utils/utils.module';
import { FetchModule } from './fetch/fetch.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperimentModule } from './experiment/experiment.module';
import { PlaygroundModule } from './playground/playground.module';
import {
  DepartmentMariaDb,
  DepartmentMariaDbRemote,
  DepartmentMsSQL,
  DepartmentMsSQLRemote,
  DepartmentMySQL,
  DepartmentMySQLRemote,
  DepartmentOracleDb,
  DepartmentOracleDbRemote,
  DepartmentPostgres,
  DepartmentPostgresRemote,
} from './models/department.model';

@Module({
  imports: [
    ApiConfigModule,
    ExperimentModule,
    ThrottlerModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: (config: ApiConfigService) => ({
        throttlers: [
          {
            ttl: config.get('throttle_api_ttl'),
            limit: config.get('throttle_api_limit'),
          },
        ],
      }),
    }),

    MongooseModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: async (configService: ApiConfigService) => ({
        pass: configService.get('mongo_password'),
        user: configService.get('mongo_username'),
        uri: 'mongodb://localhost:27017/admin',
      }),
    }),

    // Postgres
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'postgres',
      useFactory: async (configService: ApiConfigService) => ({
        name: 'postgres',
        dialect: 'postgres',
        host: configService.get('db_host'),
        port: Number(configService.get('db_port')),
        username: configService.get('db_username'),
        password: configService.get('db_password'),
        database: configService.get('db_name'),
        models: [DepartmentPostgres],
        autoLoadModels: true,
        synchronize: false,
        benchmark: true,
        ...(configService.get('db_host') !== 'localhost' && {
          dialectOptions: {
            ssl: {
              require: true, // This will help you. But you will see nwe error
              rejectUnauthorized: false, // This line will fix new error
            },
          },
        }),
        logging: configService.get('db_logging'),
      }),
    }),

    // Postgres Remote
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'postgres_remote',
      useFactory: async (configService: ApiConfigService) => ({
        name: 'postgres',
        dialect: 'postgres',
        host: configService.get('db_host_remote'),
        port: Number(configService.get('db_port_remote')),
        username: configService.get('db_username_remote'),
        password: configService.get('db_password_remote'),
        database: configService.get('db_name_remote'),
        models: [DepartmentPostgresRemote],
        autoLoadModels: true,
        synchronize: false,
        benchmark: true,
        ...(configService.get('db_host_remote') !== 'localhost' && {
          dialectOptions: {
            ssl: {
              require: true, // This will help you. But you will see nwe error
              rejectUnauthorized: false, // This line will fix new error
            },
          },
        }),
        logging: configService.get('db_logging'),
      }),
    }),

    // MySQL
    // Run CREATE DATABASE `main`; to create a separate db for yourself
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mysql',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mysql',
          dialect: 'mysql',
          host: configService.get('my_sql_db_host'),
          port: Number(configService.get('my_sql_db_port')),
          username: configService.get('my_sql_db_username'),
          password: configService.get('my_sql_db_password'),
          database: configService.get('my_sql_db_name'),
          models: [DepartmentMySQL],
          autoLoadModels: true,
          synchronize: false,
          benchmark: true,
          logging: configService.get('db_logging'),
        };
      },
    }),

    // MySQL Remote
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mysql_remote',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mysql',
          dialect: 'mysql',
          host: configService.get('my_sql_db_host_remote'),
          port: Number(configService.get('my_sql_db_port_remote')),
          username: configService.get('my_sql_db_username_remote'),
          password: configService.get('my_sql_db_password_remote'),
          database: configService.get('my_sql_db_name_remote'),
          models: [DepartmentMySQLRemote],
          autoLoadModels: true,
          synchronize: false,
          benchmark: true,
          logging: configService.get('db_logging'),
        };
      },
    }),

    // RUN this before accessing a db, and change your MS_SQL_DB_NAME to 'testdb' https://stackoverflow.com/questions/53526505/granting-full-sql-server-permissions-for-a-database
    // CREATE DATABASE testdb;

    // USE testdb;
    // GO
    // ALTER ROLE db_owner ADD MEMBER [admin];

    // MSSQL
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mssql',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mssql',
          dialect: 'mssql',
          benchmark: true,
          host: configService.get('ms_sql_db_host'),
          port: Number(configService.get('ms_sql_db_port')),
          database: configService.get('ms_sql_db_name'),
          username: configService.get('ms_sql_db_username'),
          password: configService.get('ms_sql_db_password'),
          models: [DepartmentMsSQL],
          autoLoadModels: true,
          synchronize: false,
          dialectOptions: {
            // statement_timeout: 1000,
            // idle_in_transaction_session_timeout: 5000,
            options: {
              requestTimeout: 300000,
              // encrypt: true, // Use this if you're on Azure
              // trustServerCertificate: true, // Add this if you're on local development
            },
          },
          logging: configService.get('db_logging'),
        };
      },
    }),

    // MSSQL Remote
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mssql_remote',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mssql',
          dialect: 'mssql',
          benchmark: true,
          host: configService.get('ms_sql_db_host_remote'),
          port: Number(configService.get('ms_sql_db_port_remote')),
          database: configService.get('ms_sql_db_name_remote'),
          username: configService.get('ms_sql_db_username_remote'),
          password: configService.get('ms_sql_db_password_remote'),
          models: [DepartmentMsSQLRemote],
          autoLoadModels: true,
          synchronize: false,
          dialectOptions: {
            // statement_timeout: 1000,
            // idle_in_transaction_session_timeout: 5000,
            options: {
              requestTimeout: 300000,
              // encrypt: true, // Use this if you're on Azure
              // trustServerCertificate: true, // Add this if you're on local development
            },
          },
          logging: configService.get('db_logging'),
        };
      },
    }),

    // Oracle
    // Run this before starting the DB:
    // 'create user c##kaley'
    // 'grant dba to c##kaley identified by werwerWER1 container=all;'

    // To connect with datagrip use 'sys as sysdba' for username, and 'root' for password

    // To connect to remote AWS RDS instance use SID=ORCL, user=admin, password={password you have set}
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'oracledb',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'oracledb',
          dialect: 'oracle',
          host: configService.get('oracle_db_host'),
          port: Number(configService.get('oracle_db_port')),
          username: configService.get('oracle_db_username'),
          password: configService.get('oracle_db_password'),
          // apparently for local we have to comment it (and in migrations too)
          database: configService.get('oracle_db_name'),
          benchmark: true,
          models: [DepartmentOracleDb],
          autoLoadModels: true,
          synchronize: false,
          logging: configService.get('db_logging'),
        };
      },
    }),

    // Oracle Remote
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'oracledb_remote',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'oracledb',
          dialect: 'oracle',
          host: configService.get('oracle_db_host_remote'),
          port: Number(configService.get('oracle_db_port_remote')),
          username: configService.get('oracle_db_username_remote'),
          password: configService.get('oracle_db_password_remote'),
          // apparently for local we have to comment it (and in migrations too)
          database: configService.get('oracle_db_name_remote'),
          benchmark: true,
          models: [DepartmentOracleDbRemote],
          autoLoadModels: true,
          synchronize: false,
          logging: configService.get('db_logging'),
        };
      },
    }),

    // MariaDB

    // SET GLOBAL max_allowed_packet = 67108864;
    // GRANT SUPER ON *.* TO 'mariadb'@'werwer';
    // FLUSH PRIVILEGES;

    // --- Setup for AWS RDS
    // Run CREATE DATABASE `main`; to create a separate db for yourself
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mariadb',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mariadb',
          dialect: 'mariadb',
          host: configService.get('maria_db_host'),
          port: Number(configService.get('maria_db_port')),
          username: configService.get('maria_db_username'),
          password: configService.get('maria_db_password'),
          database: configService.get('maria_db_name'),
          benchmark: true,
          models: [DepartmentMariaDb],
          autoLoadModels: true,
          synchronize: false,
          logging: configService.get('db_logging'),
        };
      },
    }),

    // MariaDB Remote
    SequelizeModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      name: 'mariadb_remote',
      useFactory: async (configService: ApiConfigService) => {
        return {
          name: 'mariadb',
          dialect: 'mariadb',
          host: configService.get('maria_db_host_remote'),
          port: Number(configService.get('maria_db_port_remote')),
          username: configService.get('maria_db_username_remote'),
          password: configService.get('maria_db_password_remote'),
          database: configService.get('maria_db_name_remote'),
          benchmark: true,
          models: [DepartmentMariaDbRemote],
          autoLoadModels: true,
          synchronize: false,
          logging: configService.get('db_logging'),
        };
      },
    }),

    LoggerModule,
    UtilsModule,
    FetchModule,
    PlaygroundModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

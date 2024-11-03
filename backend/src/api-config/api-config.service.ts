import { Injectable } from '@nestjs/common';
import * as joi from 'joi';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Config, EnvConfig, SecretsManagerConfig } from './types';
import { ConfigUtilsService } from 'src/utils/config-utils/config-utils.service';
import { Environment, Environments } from 'src/types';

dotenv.config({
  /**
   * This path is relative to /backend/src/config/config.ts file
   *    - in test / local we get .env from backend folder
   *    - in other environments we dont use .env file, instead we use env variables
   *      provided by Elastic Beanstalk + we combine them with secrets provided
   *      from AWS Secrets Manager. Our gitlab deployment machine has a role that
   *      allows it to read from AWS Secrets Manager, so no aws api keys should
   *      be provided for it
   */
  path: path.resolve(
    __dirname,
    (() => {
      switch (process.env.NODE_ENV) {
        case Environment.test:
          return '../../.test.env';
        case Environment.local:
          return '../../.env';
        default:
          return '../.env';
      }
    })(),
  ),
});

@Injectable()
export class ApiConfigService {
  protected config: Config;

  constructor(private readonly configUtilsService: ConfigUtilsService) {}

  public get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }

  public async init() {
    const localConfigValues: EnvConfig =
      this.configUtilsService.parseSrc<EnvConfig>(
        {
          node_env: {
            name: 'NODE_ENV',
            verify: joi
              .string()
              .valid(...Environments)
              .required(),
          },
        },
        [process.env],
      );

    const secretsMangerConfigValues: SecretsManagerConfig =
      this.configUtilsService.parseSrc<SecretsManagerConfig>(
        {
          port: {
            verify: joi.number().positive().required(),
            name: 'PORT',
            postProcess: (v: string) => Number(v),
          },

          db_to_migrate: {
            verify: joi.string().required(),
            name: 'DB_TO_MIGRATE',
          },
          db_logging: {
            verify: joi.boolean().required(),
            name: 'DB_LOGGING',
            postProcess: (v: string) => (v === 'true' ? true : false),
          },

          db_port: {
            verify: joi.number().positive().required(),
            name: 'DB_PORT',
          },
          db_password: {
            verify: joi.string().required(),
            name: 'DB_PASSWORD',
          },
          db_username: {
            verify: joi.string().required(),
            name: 'DB_USERNAME',
          },
          db_name: {
            verify: joi.string().required(),
            name: 'DB_NAME',
          },
          db_host: {
            verify: joi.string().required(),
            name: 'DB_HOST',
          },

          my_sql_db_port: {
            verify: joi.number().positive().required(),
            name: 'MY_SQL_DB_PORT',
          },
          my_sql_db_password: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_PASSWORD',
          },
          my_sql_db_username: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_USERNAME',
          },
          my_sql_db_name: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_NAME',
          },
          my_sql_db_host: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_HOST',
          },

          ms_sql_db_port: {
            verify: joi.number().positive().required(),
            name: 'MS_SQL_DB_PORT',
          },
          ms_sql_db_password: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_PASSWORD',
          },
          ms_sql_db_username: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_USERNAME',
          },
          ms_sql_db_name: {
            verify: joi.optional(),
            name: 'MS_SQL_DB_NAME',
          },
          ms_sql_db_host: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_HOST',
          },

          oracle_db_port: {
            verify: joi.number().positive().required(),
            name: 'ORACLE_DB_PORT',
          },
          oracle_db_password: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_PASSWORD',
          },
          oracle_db_username: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_USERNAME',
          },
          oracle_db_name: {
            verify: joi.string().optional().allow(''),
            name: 'ORACLE_DB_NAME',
          },
          oracle_db_host: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_HOST',
          },

          maria_db_port: {
            verify: joi.number().positive().required(),
            name: 'MARIA_DB_PORT',
          },
          maria_db_password: {
            verify: joi.string().required(),
            name: 'MARIA_DB_PASSWORD',
          },
          maria_db_username: {
            verify: joi.string().required(),
            name: 'MARIA_DB_USERNAME',
          },
          maria_db_name: {
            verify: joi.string().required(),
            name: 'MARIA_DB_NAME',
          },
          maria_db_host: {
            verify: joi.string().required(),
            name: 'MARIA_DB_HOST',
          },

          db_port_remote: {
            verify: joi.number().positive().required(),
            name: 'DB_PORT_REMOTE',
          },
          db_password_remote: {
            verify: joi.string().required(),
            name: 'DB_PASSWORD_REMOTE',
          },
          db_username_remote: {
            verify: joi.string().required(),
            name: 'DB_USERNAME_REMOTE',
          },
          db_name_remote: {
            verify: joi.string().required(),
            name: 'DB_NAME_REMOTE',
          },
          db_host_remote: {
            verify: joi.string().required(),
            name: 'DB_HOST_REMOTE',
          },

          my_sql_db_port_remote: {
            verify: joi.number().positive().required(),
            name: 'MY_SQL_DB_PORT_REMOTE',
          },
          my_sql_db_password_remote: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_PASSWORD_REMOTE',
          },
          my_sql_db_username_remote: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_USERNAME_REMOTE',
          },
          my_sql_db_name_remote: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_NAME_REMOTE',
          },
          my_sql_db_host_remote: {
            verify: joi.string().required(),
            name: 'MY_SQL_DB_HOST_REMOTE',
          },

          ms_sql_db_port_remote: {
            verify: joi.number().positive().required(),
            name: 'MS_SQL_DB_PORT_REMOTE',
          },
          ms_sql_db_password_remote: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_PASSWORD_REMOTE',
          },
          ms_sql_db_username_remote: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_USERNAME_REMOTE',
          },
          ms_sql_db_name_remote: {
            verify: joi.optional(),
            name: 'MS_SQL_DB_NAME_REMOTE',
          },
          ms_sql_db_host_remote: {
            verify: joi.string().required(),
            name: 'MS_SQL_DB_HOST_REMOTE',
          },

          oracle_db_port_remote: {
            verify: joi.number().positive().required(),
            name: 'ORACLE_DB_PORT_REMOTE',
          },
          oracle_db_password_remote: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_PASSWORD_REMOTE',
          },
          oracle_db_username_remote: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_USERNAME_REMOTE',
          },
          oracle_db_name_remote: {
            verify: joi.string().optional().allow(''),
            name: 'ORACLE_DB_NAME_REMOTE',
          },
          oracle_db_host_remote: {
            verify: joi.string().required(),
            name: 'ORACLE_DB_HOST_REMOTE',
          },

          maria_db_port_remote: {
            verify: joi.number().positive().required(),
            name: 'MARIA_DB_PORT_REMOTE',
          },
          maria_db_password_remote: {
            verify: joi.string().required(),
            name: 'MARIA_DB_PASSWORD_REMOTE',
          },
          maria_db_username_remote: {
            verify: joi.string().required(),
            name: 'MARIA_DB_USERNAME_REMOTE',
          },
          maria_db_name_remote: {
            verify: joi.string().required(),
            name: 'MARIA_DB_NAME_REMOTE',
          },
          maria_db_host_remote: {
            verify: joi.string().required(),
            name: 'MARIA_DB_HOST_REMOTE',
          },

          mongo_password: {
            verify: joi.string().required(),
            name: 'MONGO_PASSWORD',
          },
          mongo_username: {
            verify: joi.string().required(),
            name: 'MONGO_USERNAME',
          },

          throttle_api_limit: {
            verify: joi.number().required(),
            name: 'THROTTLE_API_LIMIT',
            postProcess: (v: string) => Number(v),
          },
          throttle_api_ttl: {
            verify: joi.number().required(),
            name: 'THROTTLE_API_TTL',
            postProcess: (v: string) => Number(v),
          },

          front_host: {
            verify: joi.string().required(),
            name: 'FRONT_HOST',
          },
          backend_host: {
            verify: joi.string().required(),
            name: 'BACKEND_HOST',
          },

          app_version: {
            verify: joi.string().required(),
            name: 'APP_VERSION',
          },
        },
        (() => {
          const srcList: Record<string, any>[] = [];

          if (
            [Environment.local, Environment.test].includes(
              localConfigValues.node_env,
            )
          ) {
            srcList.push(process.env);
          }

          return srcList;
        })(),
      );

    // Combine all config vars and execute final transforms
    this.config = <Config>{
      ...localConfigValues,
      ...secretsMangerConfigValues,

      // Derived
      front_domain: new URL(secretsMangerConfigValues.front_host).hostname,
      backend_domain: new URL(secretsMangerConfigValues.backend_host).hostname,
    };
  }
}

import { IntersectionType } from '@nestjs/swagger';
import { Environment } from 'src/types';

/**
 * @description - config that should always be present in environment variables where application is run
 */
export class EnvConfig {
  node_env: Environment;

  aws_secret_id?: string;
  aws_region?: string;
}

export class SecretsManagerConfig {
  port: number;

  db_to_migrate: 'postgres' | 'mysql' | 'mssql' | 'oracle';
  db_logging: boolean;

  db_port: number;
  db_password: string;
  db_username: string;
  db_name: string;
  db_host: string;

  my_sql_db_port: number;
  my_sql_db_password: string;
  my_sql_db_username: string;
  my_sql_db_name: string;
  my_sql_db_host: string;

  ms_sql_db_port: number;
  ms_sql_db_password: string;
  ms_sql_db_username: string;
  ms_sql_db_name?: string;
  ms_sql_db_host: string;

  oracle_db_port: number;
  oracle_db_password: string;
  oracle_db_username: string;
  oracle_db_name: string;
  oracle_db_host: string;

  maria_db_port: number;
  maria_db_password: string;
  maria_db_username: string;
  maria_db_name: string;
  maria_db_host: string;

  db_port_remote: number;
  db_password_remote: string;
  db_username_remote: string;
  db_name_remote: string;
  db_host_remote: string;

  my_sql_db_port_remote: number;
  my_sql_db_password_remote: string;
  my_sql_db_username_remote: string;
  my_sql_db_name_remote: string;
  my_sql_db_host_remote: string;

  ms_sql_db_port_remote: number;
  ms_sql_db_password_remote: string;
  ms_sql_db_username_remote: string;
  ms_sql_db_name_remote?: string;
  ms_sql_db_host_remote: string;

  oracle_db_port_remote: number;
  oracle_db_password_remote: string;
  oracle_db_username_remote: string;
  oracle_db_name_remote: string;
  oracle_db_host_remote: string;

  maria_db_port_remote: number;
  maria_db_password_remote: string;
  maria_db_username_remote: string;
  maria_db_name_remote: string;
  maria_db_host_remote: string;

  mongo_password: string;
  mongo_username: string;

  throttle_api_limit: number;
  throttle_api_ttl: number;

  front_host: string;
  backend_host: string;

  // Derived
  app_version: string;
  mocked_login_user_email: string;
}

export class Config extends IntersectionType(EnvConfig, SecretsManagerConfig) {}

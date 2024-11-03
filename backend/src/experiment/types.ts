import { DbConnection, DbEngine } from 'src/types';

export interface ExperimentRunnerParams {
  dbEngine: DbEngine;
  env: ExperimentEnvironment;
}

export enum ExperimentEnvironment {
  LOCAL = 'LOCAL',
  REMOTE = 'REMOTE',
}

export interface ExperimentConfig {
  config: {
    prepare: (params: ExperimentRunnerParams) => any;
    cleanup: (params: ExperimentRunnerParams) => any;
    runner: ExperimentRunnerConfig;
    name?: string;
    description?: string;
  };
}

export type ExperimentRunnerConfig =
  | {
      type: 'raw';
      sql: SQlRawConfig;
    }
  | {
      type: 'orm';
      method: MethodConfig;
    };

export interface SQlRawConfig {
  postgres?: string;
  mssql?: string;
  mysql?: string;
  oracle?: string;
  mariadb?: string;
}

export interface MethodConfig {
  postgres?: (params: ExperimentRunnerParams) => any;
  mssql?: (params: ExperimentRunnerParams) => any;
  mysql?: (params: ExperimentRunnerParams) => any;
  oracle?: (params: ExperimentRunnerParams) => any;
  mariadb?: (params: ExperimentRunnerParams) => any;
}

export enum DbKeys {
  postgres = 'postgres',
  mssql = 'mssql',
  mysql = 'mysql',
  oracle = 'oracle',
  mariadb = 'mariadb',
}

export type ExperimentMap = {
  [key in string]: ExperimentConfig;
};

export interface ExperimentParams {
  id: string;
  name: string;
  description: string;
  code: string;
  env?: ExperimentEnvironment;

  request:
    | {
        type: 'raw';
        sql: string;
      }
    | {
        type: 'orm';
        method: (...args: any[]) => any;
      };
  connection: ExperimentDbParams;
  context: ExperimentContext;
}

export interface ExperimentContext {
  runs?: number;
  cacheClient?: 'never' | 'between-runs';
  returnData?: boolean;

  firstRowSd?: boolean;
  firstRowMean?: boolean;
  sd?: boolean;
  mean?: boolean;
  byRowSd?: boolean;
  byRowMean?: boolean;
}

export interface ExperimentDbParams {
  requestModifiers:
    | {
        engine: DbEngine.postgres;
        experimentType: ExperimentType.DEFAULT | ExperimentType.EXPLAIN_ANALYZE;
      }
    | {
        engine: DbEngine.mssql;
        experimentType: ExperimentType.DEFAULT | ExperimentType.STATISTICS_ON;
      }
    | {
        engine: DbEngine.mysql;
        experimentType: ExperimentType.DEFAULT;
      }
    | {
        engine: DbEngine.oracle;
        experimentType: ExperimentType.DEFAULT;
      }
    | {
        engine: DbEngine.mariadb;
        experimentType: ExperimentType.DEFAULT;
      };
  connection: DbConnection;
}

export enum ExperimentType {
  DEFAULT = 'DEFAULT',

  // Only postgres-applicable
  EXPLAIN_ANALYZE = 'EXPLAIN_ANALYZE',

  // Only mssql-applicable
  STATISTICS_ON = 'STATISTICS_ON',
}

export interface RunExperimentInMapByKeyParams {
  key: string;
  dbEngine: DbEngine;
  env: ExperimentEnvironment;
  runs?: number;
}

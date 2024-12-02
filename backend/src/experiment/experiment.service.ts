import { Injectable, Logger } from '@nestjs/common';
import { SeedsService } from 'src/seeds/seeds.service';
import { FetchService } from 'src/fetch/fetch.service';
import { ApiConfigService } from 'src/api-config/api-config.service';
import {
  DbKeys,
  ExperimentContext,
  ExperimentEnvironment,
  ExperimentMap,
  ExperimentParams,
  ExperimentRunnerParams,
  ExperimentType,
  RunExperimentInMapByKeyParams,
} from './types';
import { DbEngine, SQLOrRequest } from 'src/types';
import { PsqlService } from 'src/fetch/psql.service';
import { MsSQLService } from 'src/fetch/mssql.service';
import { InternalServerError } from 'src/utils/types';
import {
  AggregatedStats,
  ExperimentResponse,
  ExperimentStats,
  RequestRunner,
  RequestStats,
} from 'src/fetch/types';
import { MySQLService } from 'src/fetch/mysql.service';
import { OracleDBService } from 'src/fetch/oracledb.service';
import { UtilsService } from 'src/utils/utils.service';
import { v4 } from 'uuid';
import { MariaDBService } from 'src/fetch/mariadb.service';
import * as fs from 'fs/promises';
import { MathUtilsService } from 'src/utils/math-utils/math-utils.service';
import { InjectModel } from '@nestjs/sequelize';
import Department, {
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
} from 'src/models/department.model';

@Injectable()
export class ExperimentService {
  private readonly l = new Logger(ExperimentService.name);

  private fetchDeps = {
    postgres: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department" AS "Department"`,
    mysql:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department`',
    mssql:
      'SELECT [id], [name], [zohoId], [parentId], [createdAt], [updatedAt], [deletedAt] FROM [Department] AS [Department]',
    oracle: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department"  "Department"`,
    mariadb:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department`',
  };

  private fetchDepsOrderBy = {
    postgres: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department" AS "Department" ORDER BY "Department"."name" ASC`,
    mysql:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department` ORDER BY `Department`.`name` ASC',
    mssql: `SELECT [id], [name], [zohoId], [parentId], [createdAt], [updatedAt], [deletedAt] FROM [Department] AS [Department] ORDER BY [Department].[name] ASC`,
    oracle: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department"  "Department" ORDER BY "Department"."name" ASC`,
    mariadb:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department` ORDER BY `Department`.`name` ASC',
  };

  private fetchDepsFiltering = {
    postgres: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department" AS "Department" WHERE ("Department"."deletedAt" IS NULL)`,
    mysql:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department` WHERE (`Department`.`deletedAt` IS NULL)',
    mssql: `SELECT [id], [name], [zohoId], [parentId], [createdAt], [updatedAt], [deletedAt] FROM [Department] AS [Department] WHERE ([Department].[deletedAt] IS NULL)`,
    oracle: `SELECT "id", "name", "zohoId", "parentId", "createdAt", "updatedAt", "deletedAt" FROM "Department"  "Department" WHERE ("Department"."deletedAt" IS NULL)`,
    mariadb:
      'SELECT `id`, `name`, `zohoId`, `parentId`, `createdAt`, `updatedAt`, `deletedAt` FROM `Department` AS `Department` WHERE (`Department`.`deletedAt` IS NULL)',
  };

  private fetchDepsWithSubDepartmentsInnerJoin = {
    postgres: `SELECT "Department"."id",
    "Department"."name",
    "Department"."zohoId",
    "Department"."parentId",
    "Department"."createdAt",
    "Department"."updatedAt",
    "Department"."deletedAt",
    "subDepartments"."id"        AS "subDepartments.id",
    "subDepartments"."name"      AS "subDepartments.name",
    "subDepartments"."zohoId"    AS "subDepartments.zohoId",
    "subDepartments"."parentId"  AS "subDepartments.parentId",
    "subDepartments"."createdAt" AS "subDepartments.createdAt",
    "subDepartments"."updatedAt" AS "subDepartments.updatedAt",
    "subDepartments"."deletedAt" AS "subDepartments.deletedAt"
FROM "Department" AS "Department"
      INNER JOIN "Department" AS "subDepartments"
                  ON "Department"."id" = "subDepartments"."parentId"`,
    mysql:
      'SELECT `Department`.`id`, `Department`.`name`, `Department`.`zohoId`, `Department`.`parentId`, `Department`.`createdAt`, `Department`.`updatedAt`, `Department`.`deletedAt`, `subDepartments`.`id` AS `subDepartments.id`, `subDepartments`.`name` AS `subDepartments.name`, `subDepartments`.`zohoId` AS `subDepartments.zohoId`, `subDepartments`.`parentId` AS `subDepartments.parentId`, `subDepartments`.`createdAt` AS `subDepartments.createdAt`, `subDepartments`.`updatedAt` AS `subDepartments.updatedAt`, `subDepartments`.`deletedAt` AS `subDepartments.deletedAt` FROM `Department` AS `Department` INNER JOIN `Department` AS `subDepartments` ON `Department`.`id` = `subDepartments`.`parentId`',
    mssql:
      'SELECT [Department].[id], [Department].[name], [Department].[zohoId], [Department].[parentId], [Department].[createdAt], [Department].[updatedAt], [Department].[deletedAt], [subDepartments].[id] AS [subDepartments.id], [subDepartments].[name] AS [subDepartments.name], [subDepartments].[zohoId] AS [subDepartments.zohoId], [subDepartments].[parentId] AS [subDepartments.parentId], [subDepartments].[createdAt] AS [subDepartments.createdAt], [subDepartments].[updatedAt] AS [subDepartments.updatedAt], [subDepartments].[deletedAt] AS [subDepartments.deletedAt] FROM [Department] AS [Department] INNER JOIN [Department] AS [subDepartments] ON [Department].[id] = [subDepartments].[parentId]',
    oracle: `SELECT "Department"."id", "Department"."name", "Department"."zohoId", "Department"."parentId", "Department"."createdAt", "Department"."updatedAt", "Department"."deletedAt", "subDepartments"."id" AS "subDepartments.id", "subDepartments"."name" AS "subDepartments.name", "subDepartments"."zohoId" AS "subDepartments.zohoId", "subDepartments"."parentId" AS "subDepartments.parentId", "subDepartments"."createdAt" AS "subDepartments.createdAt", "subDepartments"."updatedAt" AS "subDepartments.updatedAt", "subDepartments"."deletedAt" AS "subDepartments.deletedAt" FROM "Department"  "Department" INNER JOIN "Department"  "subDepartments" ON "Department"."id" = "subDepartments"."parentId"`,
    mariadb:
      'SELECT `Department`.`id`, `Department`.`name`, `Department`.`zohoId`, `Department`.`parentId`, `Department`.`createdAt`, `Department`.`updatedAt`, `Department`.`deletedAt`, `subDepartments`.`id` AS `subDepartments.id`, `subDepartments`.`name` AS `subDepartments.name`, `subDepartments`.`zohoId`    AS `subDepartments.zohoId`, `subDepartments`.`parentId`  AS `subDepartments.parentId`, `subDepartments`.`createdAt` AS `subDepartments.createdAt`, `subDepartments`.`updatedAt` AS `subDepartments.updatedAt`, `subDepartments`.`deletedAt` AS `subDepartments.deletedAt` FROM `Department` AS `Department` INNER JOIN `Department` AS `subDepartments` ON `Department`.`id` = `subDepartments`.`parentId`',
  };

  private fetchDepsWithSubDepartmentsLeftOuterJoin = {
    postgres: `SELECT "Department"."id",
       "Department"."name",
       "Department"."zohoId",
       "Department"."parentId",
       "Department"."createdAt",
       "Department"."updatedAt",
       "Department"."deletedAt",
       "subDepartments"."id"        AS "subDepartments.id",
       "subDepartments"."name"      AS "subDepartments.name",
       "subDepartments"."zohoId"    AS "subDepartments.zohoId",
       "subDepartments"."parentId"  AS "subDepartments.parentId",
       "subDepartments"."createdAt" AS "subDepartments.createdAt",
       "subDepartments"."updatedAt" AS "subDepartments.updatedAt",
       "subDepartments"."deletedAt" AS "subDepartments.deletedAt"
FROM "Department" AS "Department"
         LEFT OUTER JOIN "Department" AS "subDepartments"
                         ON "Department"."id" = "subDepartments"."parentId"`,
    mysql:
      'SELECT `Department`.`id`, `Department`.`name`, `Department`.`zohoId`, `Department`.`parentId`, `Department`.`createdAt`, `Department`.`updatedAt`, `Department`.`deletedAt`, `subDepartments`.`id` AS `subDepartments.id`, `subDepartments`.`name` AS `subDepartments.name`, `subDepartments`.`zohoId` AS `subDepartments.zohoId`, `subDepartments`.`parentId` AS `subDepartments.parentId`, `subDepartments`.`createdAt` AS `subDepartments.createdAt`, `subDepartments`.`updatedAt` AS `subDepartments.updatedAt`, `subDepartments`.`deletedAt` AS `subDepartments.deletedAt` FROM `Department` AS `Department` LEFT OUTER JOIN `Department` AS `subDepartments` ON `Department`.`id` = `subDepartments`.`parentId`',
    mssql:
      'SELECT [Department].[id], [Department].[name], [Department].[zohoId], [Department].[parentId], [Department].[createdAt], [Department].[updatedAt], [Department].[deletedAt], [subDepartments].[id] AS [subDepartments.id], [subDepartments].[name] AS [subDepartments.name], [subDepartments].[zohoId] AS [subDepartments.zohoId], [subDepartments].[parentId] AS [subDepartments.parentId], [subDepartments].[createdAt] AS [subDepartments.createdAt], [subDepartments].[updatedAt] AS [subDepartments.updatedAt], [subDepartments].[deletedAt] AS [subDepartments.deletedAt] FROM [Department] AS [Department] LEFT OUTER JOIN [Department] AS [subDepartments] ON [Department].[id] = [subDepartments].[parentId]',
    oracle: `SELECT "Department"."id", "Department"."name", "Department"."zohoId", "Department"."parentId", "Department"."createdAt", "Department"."updatedAt", "Department"."deletedAt", "subDepartments"."id" AS "subDepartments.id", "subDepartments"."name" AS "subDepartments.name", "subDepartments"."zohoId" AS "subDepartments.zohoId", "subDepartments"."parentId" AS "subDepartments.parentId", "subDepartments"."createdAt" AS "subDepartments.createdAt", "subDepartments"."updatedAt" AS "subDepartments.updatedAt", "subDepartments"."deletedAt" AS "subDepartments.deletedAt" FROM "Department"  "Department" LEFT OUTER JOIN "Department"  "subDepartments" ON "Department"."id" = "subDepartments"."parentId"`,
    mariadb:
      'SELECT `Department`.`id`, `Department`.`name`, `Department`.`zohoId`, `Department`.`parentId`, `Department`.`createdAt`, `Department`.`updatedAt`, `Department`.`deletedAt`, `subDepartments`.`id` AS `subDepartments.id`, `subDepartments`.`name` AS `subDepartments.name`, `subDepartments`.`zohoId`    AS `subDepartments.zohoId`, `subDepartments`.`parentId`  AS `subDepartments.parentId`, `subDepartments`.`createdAt` AS `subDepartments.createdAt`, `subDepartments`.`updatedAt` AS `subDepartments.updatedAt`, `subDepartments`.`deletedAt` AS `subDepartments.deletedAt` FROM `Department` AS `Department` LEFT OUTER JOIN `Department` AS `subDepartments` ON `Department`.`id` = `subDepartments`.`parentId`',
  };

  // 101
  private fetchDepsOrm(params: ExperimentRunnerParams): any {
    const model = this.getModelFromDbEngineAndEnv(params.dbEngine, params.env);

    return model.findAll({ paranoid: false });
  }

  // 102
  private fetchDepsOrderByOrm(params: ExperimentRunnerParams): any {
    const model = this.getModelFromDbEngineAndEnv(params.dbEngine, params.env);

    return model.findAll({
      paranoid: false,
      order: [['name', 'ASC']],
    });
  }

  // 103
  private fetchDepsFilteringOrm(params: ExperimentRunnerParams): any {
    const model = this.getModelFromDbEngineAndEnv(params.dbEngine, params.env);

    return model.findAll();
  }

  // 104
  private fetchDepsWithSubDepartmentsInnerJoinOrm(
    params: ExperimentRunnerParams,
  ): any {
    const model = this.getModelFromDbEngineAndEnv(params.dbEngine, params.env);

    return model.findAll({
      paranoid: false,
      include: [
        {
          model,
          as: 'subDepartments',
          required: true,
          paranoid: false,
        },
      ],
    });
  }

  // 105
  private fetchDepsWithSubDepartmentsLeftOuterJoinOrm(
    params: ExperimentRunnerParams,
  ): any {
    const model = this.getModelFromDbEngineAndEnv(params.dbEngine, params.env);

    return model.findAll({
      paranoid: false,
      include: [
        {
          model,
          as: 'subDepartments',
          required: false,
          paranoid: false,
        },
      ],
    });
  }

  public readonly experimentsMap: ExperimentMap = {
    // each with 100k and 1m
    // each with orm and raw

    // 101 - normal - fetchDeps
    // 102 - order by - fetchDepsOrderBy
    // 103 - filtering - fetchDepsFiltering
    // 104 - inner join - fetchDepsWithSubDepartmentsInnerJoin
    // 105 - left outer join - fetchDepsWithSubDepartmentsLeftOuterJoin
    // 106 - normal with indices

    _101_raw_100k: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDeps.postgres,
            mysql: this.fetchDeps.mysql,
            mssql: this.fetchDeps.mssql,
            oracle: this.fetchDeps.oracle,
            mariadb: this.fetchDeps.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 100000,
            subDepartmentsCount: 0,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _101_raw_1m: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDeps.postgres,
            mysql: this.fetchDeps.mysql,
            mssql: this.fetchDeps.mssql,
            oracle: this.fetchDeps.oracle,
            mariadb: this.fetchDeps.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 100000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _101_orm_100k: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsOrm.bind(this),
            mysql: this.fetchDepsOrm.bind(this),
            mssql: this.fetchDepsOrm.bind(this),
            oracle: this.fetchDepsOrm.bind(this),
            mariadb: this.fetchDepsOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 100000,
            subDepartmentsCount: 0,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _101_orm_1m: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsOrm.bind(this),
            mysql: this.fetchDepsOrm.bind(this),
            mssql: this.fetchDepsOrm.bind(this),
            oracle: this.fetchDepsOrm.bind(this),
            mariadb: this.fetchDepsOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 100000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },

    _102_raw_100k: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsOrderBy.postgres,
            mysql: this.fetchDepsOrderBy.mysql,
            mssql: this.fetchDepsOrderBy.mssql,
            oracle: this.fetchDepsOrderBy.oracle,
            mariadb: this.fetchDepsOrderBy.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 100000,
            subDepartmentsCount: 0,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _102_raw_1m: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsOrderBy.postgres,
            mysql: this.fetchDepsOrderBy.mysql,
            mssql: this.fetchDepsOrderBy.mssql,
            oracle: this.fetchDepsOrderBy.oracle,
            mariadb: this.fetchDepsOrderBy.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 100000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _102_orm_100k: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsOrderByOrm.bind(this),
            mysql: this.fetchDepsOrderByOrm.bind(this),
            mssql: this.fetchDepsOrderByOrm.bind(this),
            oracle: this.fetchDepsOrderByOrm.bind(this),
            mariadb: this.fetchDepsOrderByOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 100000,
            subDepartmentsCount: 0,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _102_orm_1m: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsOrderByOrm.bind(this),
            mysql: this.fetchDepsOrderByOrm.bind(this),
            mssql: this.fetchDepsOrderByOrm.bind(this),
            oracle: this.fetchDepsOrderByOrm.bind(this),
            mariadb: this.fetchDepsOrderByOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 100000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },

    _103_raw_100k: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsFiltering.postgres,
            mysql: this.fetchDepsFiltering.mysql,
            mssql: this.fetchDepsFiltering.mssql,
            oracle: this.fetchDepsFiltering.oracle,
            mariadb: this.fetchDepsFiltering.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 2; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              data: {
                deletedAt: new Date(),
              },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
          for (let i = 0; i < 2; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: false,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _103_raw_1m: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsFiltering.postgres,
            mysql: this.fetchDepsFiltering.mysql,
            mssql: this.fetchDepsFiltering.mssql,
            oracle: this.fetchDepsFiltering.oracle,
            mariadb: this.fetchDepsFiltering.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 20; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              data: {
                deletedAt: new Date(),
              },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }

          for (let i = 0; i < 20; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: false,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _103_orm_100k: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsFilteringOrm.bind(this),
            mysql: this.fetchDepsFilteringOrm.bind(this),
            mssql: this.fetchDepsFilteringOrm.bind(this),
            oracle: this.fetchDepsFilteringOrm.bind(this),
            mariadb: this.fetchDepsFilteringOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 2; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              data: {
                deletedAt: new Date(),
              },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
          for (let i = 0; i < 2; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: false,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _103_orm_1m: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsFilteringOrm.bind(this),
            mysql: this.fetchDepsFilteringOrm.bind(this),
            mssql: this.fetchDepsFilteringOrm.bind(this),
            oracle: this.fetchDepsFilteringOrm.bind(this),
            mariadb: this.fetchDepsFilteringOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 20; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              data: {
                deletedAt: new Date(),
              },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
          for (let i = 0; i < 20; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 0,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: false,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },

    _104_raw_100k: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsWithSubDepartmentsInnerJoin.postgres,
            mysql: this.fetchDepsWithSubDepartmentsInnerJoin.mysql,
            mssql: this.fetchDepsWithSubDepartmentsInnerJoin.mssql,
            oracle: this.fetchDepsWithSubDepartmentsInnerJoin.oracle,
            mariadb: this.fetchDepsWithSubDepartmentsInnerJoin.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 50000,
            subDepartmentsCount: 1,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _104_raw_1m: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsWithSubDepartmentsInnerJoin.postgres,
            mysql: this.fetchDepsWithSubDepartmentsInnerJoin.mysql,
            mssql: this.fetchDepsWithSubDepartmentsInnerJoin.mssql,
            oracle: this.fetchDepsWithSubDepartmentsInnerJoin.oracle,
            mariadb: this.fetchDepsWithSubDepartmentsInnerJoin.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 1,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _104_orm_100k: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mysql: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mssql: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            oracle: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mariadb: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 50000,
            subDepartmentsCount: 1,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _104_orm_1m: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mysql: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mssql: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            oracle: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
            mariadb: this.fetchDepsWithSubDepartmentsInnerJoinOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 1,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },

    _105_raw_100k: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsWithSubDepartmentsLeftOuterJoin.postgres,
            mysql: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mysql,
            mssql: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mssql,
            oracle: this.fetchDepsWithSubDepartmentsLeftOuterJoin.oracle,
            mariadb: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 50000,
            subDepartmentsCount: 1,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _105_raw_1m: {
      config: {
        runner: {
          type: 'raw',
          sql: {
            postgres: this.fetchDepsWithSubDepartmentsLeftOuterJoin.postgres,
            mysql: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mysql,
            mssql: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mssql,
            oracle: this.fetchDepsWithSubDepartmentsLeftOuterJoin.oracle,
            mariadb: this.fetchDepsWithSubDepartmentsLeftOuterJoin.mariadb,
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 1,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _105_orm_100k: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres:
              this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mysql: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mssql: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            oracle: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mariadb:
              this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          await this.seedsService.seedDepartmentsWithParents({
            depsCount: 50000,
            subDepartmentsCount: 1,
            db: { type: 'sql', dbEngine: params.dbEngine },
            env: params.env,

            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
    _105_orm_1m: {
      config: {
        runner: {
          type: 'orm',
          method: {
            postgres:
              this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mysql: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mssql: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            oracle: this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
            mariadb:
              this.fetchDepsWithSubDepartmentsLeftOuterJoinOrm.bind(this),
          },
        },
        prepare: async (params: ExperimentRunnerParams) => {
          for (let i = 0; i < 10; i++) {
            this.l.log(`Seed run #${i + 1}`);
            await this.seedsService.seedDepartmentsWithParents({
              depsCount: 50000,
              subDepartmentsCount: 1,
              db: { type: 'sql', dbEngine: params.dbEngine },
              cleanup: i === 0,
              env: params.env,

              connectionCreds: this.getConnectionDataFromEngine(
                params.dbEngine,
                params.env,
              ),
            });
          }
        },
        cleanup: async (params: ExperimentRunnerParams) => {
          await this.seedsService.cleanSQL({
            dbEngine: params.dbEngine,
            type: 'sql',
            env: params.env,
            connectionCreds: this.getConnectionDataFromEngine(
              params.dbEngine,
              params.env,
            ),
          });
        },
      },
    },
  };

  // add preparation for mongo / redis

  constructor(
    private readonly fetchService: FetchService,
    private readonly seedsService: SeedsService,
    private readonly utilsService: UtilsService,
    private readonly psqlService: PsqlService,
    private readonly mssqlService: MsSQLService,
    private readonly mysqlService: MySQLService,
    private readonly oracleDbService: OracleDBService,
    private readonly mariaDbService: MariaDBService,
    private readonly configService: ApiConfigService,
    private readonly mathUtilsService: MathUtilsService,

    @InjectModel(DepartmentPostgres, 'postgres')
    private departmentPostgresModel: typeof DepartmentPostgres,
    @InjectModel(DepartmentMySQL, 'mysql')
    private departmentMySQLModel: typeof DepartmentMySQL,
    @InjectModel(DepartmentMsSQL, 'mssql')
    private departmentMsSQLModel: typeof DepartmentMsSQL,
    @InjectModel(DepartmentOracleDb, 'oracledb')
    private departmentOracleDbModel: typeof DepartmentOracleDb,
    @InjectModel(DepartmentMariaDb, 'mariadb')
    private departmentMariaDbModel: typeof DepartmentMariaDb,

    @InjectModel(DepartmentPostgresRemote, 'postgres_remote')
    private departmentPostgresRemoteModel: typeof DepartmentPostgresRemote,
    @InjectModel(DepartmentMySQLRemote, 'mysql_remote')
    private departmentMySQLRemoteModel: typeof DepartmentMySQLRemote,
    @InjectModel(DepartmentMsSQLRemote, 'mssql_remote')
    private departmentMsSQLRemoteModel: typeof DepartmentMsSQLRemote,
    @InjectModel(DepartmentOracleDbRemote, 'oracledb_remote')
    private departmentOracleDbRemoteModel: typeof DepartmentOracleDbRemote,
    @InjectModel(DepartmentMariaDbRemote, 'mariadb_remote')
    private departmentMariaDbRemoteModel: typeof DepartmentMariaDbRemote,
  ) {
    (async () => {
      await this.performanceForLocalInnerJoin();
    })();
  }

  public async performanceForLocalInnerJoin() {
    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.postgres,
      env: ExperimentEnvironment.LOCAL,
      key: '_104_raw_1m',
      runs: 5,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mssql,
      env: ExperimentEnvironment.LOCAL,
      key: '_104_raw_1m',
      runs: 5,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mysql,
      env: ExperimentEnvironment.LOCAL,
      key: '_104_raw_1m',
      runs: 5,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.oracle,
      env: ExperimentEnvironment.LOCAL,
      key: '_104_raw_1m',
      runs: 5,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mariadb,
      env: ExperimentEnvironment.LOCAL,
      key: '_104_raw_1m',
      runs: 5,
    });
  }

  public async performanceForLocal() {
    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.postgres,
      env: ExperimentEnvironment.LOCAL,
      key: '_101_raw_100k',
      runs: 10,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mssql,
      env: ExperimentEnvironment.LOCAL,
      key: '_101_raw_100k',
      runs: 10,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mysql,
      env: ExperimentEnvironment.LOCAL,
      key: '_101_raw_100k',
      runs: 10,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.oracle,
      env: ExperimentEnvironment.LOCAL,
      key: '_101_raw_100k',
      runs: 10,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mariadb,
      env: ExperimentEnvironment.LOCAL,
      key: '_101_raw_100k',
      runs: 10,
    });
  }

  public async performanceForRemote() {
    // await this.runExperimentInMapByKey({
    //   dbEngine: DbEngine.postgres,
    //   env: ExperimentEnvironment.REMOTE,
    //   key: '_101_raw_100k',
    //   runs: 1,
    // });

    // await this.runExperimentInMapByKey({
    //   dbEngine: DbEngine.mssql,
    //   env: ExperimentEnvironment.REMOTE,
    //   key: '_101_raw_100k',
    //   runs: 1,
    // });

    // await this.runExperimentInMapByKey({
    //   dbEngine: DbEngine.mysql,
    //   env: ExperimentEnvironment.REMOTE,
    //   key: '_101_raw_100k',
    //   runs: 3,
    // });

    // await this.runExperimentInMapByKey({
    //   dbEngine: DbEngine.oracle,
    //   env: ExperimentEnvironment.REMOTE,
    //   key: '_101_raw_100k',
    //   runs: 1,
    // });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mariadb,
      env: ExperimentEnvironment.REMOTE,
      key: '_101_raw_100k',
      runs: 3,
    });
  }

  public async performanceForRemote1m() {
    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.postgres,
      env: ExperimentEnvironment.REMOTE,
      key: '_101_raw_1m',
      runs: 1,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mariadb,
      env: ExperimentEnvironment.REMOTE,
      key: '_101_raw_1m',
      runs: 1,
    });
  }

  public async mariaDbIsSlowWithOrdering() {
    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.postgres,
      env: ExperimentEnvironment.LOCAL,
      key: '_102_raw_1m',
      runs: 1,
    });

    await this.runExperimentInMapByKey({
      dbEngine: DbEngine.mariadb,
      env: ExperimentEnvironment.LOCAL,
      key: '_102_raw_1m',
      runs: 1,
    });
  }

  public async runExperimentInMapByKey(params: RunExperimentInMapByKeyParams) {
    const expConfig = this.experimentsMap[params.key].config;

    if (!expConfig) {
      throw new InternalServerError(
        `Experiment config not found by key: ${params.key}`,
      );
    }

    this.l.log(`Preparing experiment with ${params.dbEngine}`);
    await expConfig.prepare({
      dbEngine: params.dbEngine as DbEngine,
      env: params.env,
    });

    await this.utilsService.sleep(1000);

    this.l.log(`Running experiment with ${params.dbEngine}`);
    const expStats = (
      await this.runExperiment([
        {
          id: v4(),
          name: v4(),
          description: `[${params.dbEngine}. ${params.runs}]`,
          code: (() => {
            return expConfig.runner.type === 'raw'
              ? expConfig.runner.sql[params.dbEngine]
              : expConfig.runner.method.toString();
          })(),
          env: params.env,
          context: {
            firstRowSd: true,
            firstRowMean: true,
            sd: true,
            mean: true,
            byRowSd: true,
            byRowMean: true,

            cacheClient: 'between-runs',
            returnData: false,
            runs: params.runs,
          },
          connection: {
            connection: {
              ...this.getConnectionDataFromEngine(
                params.dbEngine as DbEngine,
                params.env,
              ),
            },
            requestModifiers: {
              experimentType: ExperimentType.DEFAULT,
              engine: params.dbEngine as DbEngine,
            },
          },
          request: (() => {
            if (expConfig.runner.type === 'raw') {
              return {
                type: 'raw',
                sql: expConfig.runner.sql[params.dbEngine],
              };
            }

            return {
              type: 'orm',
              method: expConfig.runner.method[params.dbEngine],
            };
          })(),
        },
      ])
    )[0];

    this.l.log(`Experiment cleanup started`);
    await expConfig.cleanup({
      dbEngine: params.dbEngine as DbEngine,
      env: params.env,
    });

    await this.saveExperimentResponses(
      [expStats],
      params.dbEngine as DbEngine,
      params.env,
    );
    this.l.log(`Experiment cleanup finished`);

    return expStats;
  }

  private async runExperimentMap(
    experimentsMap: ExperimentMap,
    params: {
      runs?: number;
    },
  ) {
    const expsStats: ExperimentResponse[] = [];

    for (const [key, exp] of Object.entries(experimentsMap)) {
      this.l.log(`Key: ${key}`);

      for (const _env of Object.keys(ExperimentEnvironment)) {
        const env = _env as ExperimentEnvironment;
        for (const _dbEngine of Object.keys(DbKeys)) {
          const dbEngine = _dbEngine as DbEngine;

          this.l.log(`Preparing experiment #${key} with ${dbEngine}`);
          await exp.config.prepare({ dbEngine: dbEngine as DbEngine, env });

          await this.utilsService.sleep(1000);

          this.l.log(`Running experiment #${key} with ${dbEngine} on ${env}`);
          const expStats = (
            await this.runExperiment([
              {
                id: v4(),
                name: key,
                description: `[${dbEngine}. ${params.runs}]`,
                code: (() => {
                  return exp.config.runner.type === 'raw'
                    ? exp.config.runner.sql[dbEngine]
                    : exp.config.runner.method.toString();
                })(),
                env,
                context: {
                  firstRowSd: true,
                  firstRowMean: true,
                  sd: true,
                  mean: true,
                  byRowSd: true,
                  byRowMean: true,

                  cacheClient: 'between-runs',
                  returnData: false,
                  runs: params.runs,
                },
                connection: {
                  connection: {
                    ...this.getConnectionDataFromEngine(
                      dbEngine as DbEngine,
                      env,
                    ),
                  },
                  requestModifiers: {
                    experimentType: ExperimentType.DEFAULT,
                    engine: dbEngine as DbEngine,
                  },
                },
                request: (() => {
                  if (exp.config.runner.type === 'raw') {
                    return {
                      type: 'raw',
                      sql: exp.config.runner.sql[dbEngine],
                    };
                  }

                  return {
                    type: 'orm',
                    method: exp.config.runner.method[dbEngine],
                  };
                })(),
              },
            ])
          )[0];

          this.l.log(`Experiment cleanup started`);
          await exp.config.cleanup({ dbEngine: dbEngine as DbEngine, env });
          this.l.log(`Experiment cleanup finished`);

          expsStats.push(expStats);

          await this.saveExperimentResponses(
            [expStats],
            dbEngine as DbEngine,
            env,
          );
        }
      }
    }
  }

  private async saveExperimentResponses(
    expsStats: ExperimentResponse[],
    dbEngine: DbEngine,
    env: ExperimentEnvironment,
  ) {
    this.l.log(`Saving experiments responses`);

    const expsCsv: (string | number)[][] = [
      [
        'ID',
        'Name',
        'Description',
        'Mean',
        'SD',
        'By Row Mean',
        'By Row SD',
        'First Row Mean',
        'First Row SD',
        'Code',
      ],
    ];
    for (const expStats of expsStats) {
      const arr = [
        expStats.id,
        expStats.name,
        expStats.description,
        expStats.aggr.mean,
        expStats.aggr.sd,
        expStats.aggr.byRowMean,
        expStats.aggr.byRowSd,
        expStats.aggr.firstRowMean,
        expStats.aggr.firstRowSd,
        `"${expStats.code.replaceAll('\n', ' ').replaceAll('"', '""')}"`,
      ];

      expsCsv.push(arr);
    }

    await fs.writeFile(
      `./logs_${expsStats[0].name}_${dbEngine}_${env}.csv`,
      expsCsv.map((x) => x.join(', ')).join('\n'),
    );
  }

  async runExperiment(
    params: ExperimentParams[],
  ): Promise<ExperimentResponse[]> {
    const requestStats: ExperimentResponse[] = [];
    for (const oneParams of params) {
      const sqlOrRequest = this.getSQLOrMethod(oneParams);

      let expStats: ExperimentStats;
      if (typeof sqlOrRequest !== 'string') {
        expStats = await this.runOrmMethodWithTracking({
          method: sqlOrRequest,
          context: oneParams.context,
          dbEngine: oneParams.connection.requestModifiers.engine,
          env: oneParams.env,
        });
      } else {
        const trackingWrapper = this.getRawTrackingWrapper(oneParams);
        const connection = oneParams.connection.connection;

        expStats = await trackingWrapper({
          sqlOrRequest,
          connection,
          context: oneParams.context,
        });
      }

      requestStats.push({
        id: oneParams.id,
        name: oneParams.name,
        description: oneParams.description,
        code: oneParams.code,
        requestsStats: expStats.requestsStats,
        aggr: expStats.aggr,
      });
    }

    return requestStats;
  }

  private getConnectionDataFromEngine(
    engine: DbEngine,
    env: ExperimentEnvironment,
  ): {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    service?: string;
  } {
    if (env === ExperimentEnvironment.LOCAL) {
      switch (engine) {
        case DbEngine.postgres:
          return {
            host: this.configService.get('db_host'),
            port: Number(this.configService.get('db_port')),
            user: this.configService.get('db_username'),
            password: this.configService.get('db_password'),
            database: this.configService.get('db_name'),
          };
        case DbEngine.mssql:
          return {
            host: this.configService.get('ms_sql_db_host'),
            port: Number(this.configService.get('ms_sql_db_port')),
            user: this.configService.get('ms_sql_db_username'),
            password: this.configService.get('ms_sql_db_password'),
            database: this.configService.get('ms_sql_db_name'),
          };
        case DbEngine.mysql:
          return {
            host: this.configService.get('my_sql_db_host'),
            port: Number(this.configService.get('my_sql_db_port')),
            user: this.configService.get('my_sql_db_username'),
            password: this.configService.get('my_sql_db_password'),
            database: this.configService.get('my_sql_db_name'),
          };
        case DbEngine.oracle:
          return {
            host: this.configService.get('oracle_db_host'),
            port: Number(this.configService.get('oracle_db_port')),
            user: this.configService.get('oracle_db_username'),
            password: this.configService.get('oracle_db_password'),
            database: this.configService.get('oracle_db_name'),
            service: 'XE',
          };
        case DbEngine.mariadb:
          return {
            host: this.configService.get('maria_db_host'),
            port: Number(this.configService.get('maria_db_port')),
            user: this.configService.get('maria_db_username'),
            password: this.configService.get('maria_db_password'),
            database: this.configService.get('maria_db_name'),
          };
        default:
          break;
      }
    }

    switch (engine) {
      case DbEngine.postgres:
        return {
          host: this.configService.get('db_host_remote'),
          port: Number(this.configService.get('db_port_remote')),
          user: this.configService.get('db_username_remote'),
          password: this.configService.get('db_password_remote'),
          database: this.configService.get('db_name_remote'),
        };
      case DbEngine.mssql:
        return {
          host: this.configService.get('ms_sql_db_host_remote'),
          port: Number(this.configService.get('ms_sql_db_port_remote')),
          user: this.configService.get('ms_sql_db_username_remote'),
          password: this.configService.get('ms_sql_db_password_remote'),
          database: this.configService.get('ms_sql_db_name_remote'),
        };
      case DbEngine.mysql:
        return {
          host: this.configService.get('my_sql_db_host_remote'),
          port: Number(this.configService.get('my_sql_db_port_remote')),
          user: this.configService.get('my_sql_db_username_remote'),
          password: this.configService.get('my_sql_db_password_remote'),
          database: this.configService.get('my_sql_db_name_remote'),
        };
      case DbEngine.oracle:
        return {
          host: this.configService.get('oracle_db_host_remote'),
          port: Number(this.configService.get('oracle_db_port_remote')),
          user: this.configService.get('oracle_db_username_remote'),
          password: this.configService.get('oracle_db_password_remote'),
          database: this.configService.get('oracle_db_name_remote'),
          service: 'ORCL',
        };
      case DbEngine.mariadb:
        return {
          host: this.configService.get('maria_db_host_remote'),
          port: Number(this.configService.get('maria_db_port_remote')),
          user: this.configService.get('maria_db_username_remote'),
          password: this.configService.get('maria_db_password_remote'),
          database: this.configService.get('maria_db_name_remote'),
        };

      default:
        break;
    }
  }

  private getModelFromDbEngineAndEnv(
    engine: DbEngine,
    env: ExperimentEnvironment,
  ): typeof Department {
    if (env === ExperimentEnvironment.LOCAL) {
      switch (engine) {
        case DbEngine.postgres:
          return this.departmentPostgresModel;
        case DbEngine.mssql:
          return this.departmentMsSQLModel;
        case DbEngine.mysql:
          return this.departmentMySQLModel;
        case DbEngine.oracle:
          return this.departmentOracleDbModel;
        case DbEngine.mariadb:
          return this.departmentMariaDbModel;
        default:
          break;
      }
    }

    switch (engine) {
      case DbEngine.postgres:
        return this.departmentPostgresRemoteModel;
      case DbEngine.mssql:
        return this.departmentMySQLRemoteModel;
      case DbEngine.mysql:
        return this.departmentMsSQLRemoteModel;
      case DbEngine.oracle:
        return this.departmentOracleDbRemoteModel;
      case DbEngine.mariadb:
        return this.departmentMariaDbRemoteModel;
      default:
        break;
    }
  }

  private async runOrmMethodWithTracking({
    method,
    context,
    dbEngine,
    env,
  }: {
    method: (params: ExperimentRunnerParams) => any;
    context: ExperimentContext;
    dbEngine: DbEngine;
    env?: ExperimentEnvironment;
  }): Promise<ExperimentStats> {
    const requestsStats: RequestStats[] = [];
    for (let i = 0; i < (context.runs ?? 1); i++) {
      const from = performance.now();
      const res = await method({
        dbEngine,
        env,
      });
      const toFull = performance.now();

      const full = toFull - from;
      this.l.log(`Request #${i + 1} run. Full = ${full}, First Row = -1`);

      requestsStats.push({
        rows: context.returnData ? res.rows : [],
        stats: {
          full,
        },
      });
    }

    const aggregatedStats: AggregatedStats =
      this.mathUtilsService.getAggregatedStats(context, requestsStats);

    return {
      id: v4(),
      requestsStats,
      aggr: aggregatedStats,
    };
  }

  private getRawTrackingWrapper(params: ExperimentParams): RequestRunner {
    let method: RequestRunner | undefined;
    switch (params.connection.requestModifiers.engine) {
      case DbEngine.postgres:
        method =
          this.psqlService.experiments[
            params.connection.requestModifiers.experimentType
          ];
        break;
      case DbEngine.mssql:
        method =
          this.mssqlService.experiments[
            params.connection.requestModifiers.experimentType
          ];
        break;
      case DbEngine.mysql:
        method =
          this.mysqlService.experiments[
            params.connection.requestModifiers.experimentType
          ];
        break;
      case DbEngine.oracle:
        method =
          this.oracleDbService.experiments[
            params.connection.requestModifiers.experimentType
          ];
        break;
      case DbEngine.mariadb:
        method =
          this.mariaDbService.experiments[
            params.connection.requestModifiers.experimentType
          ];
        break;
      default:
        throw new InternalServerError(
          `DB Engine ${(params.connection.requestModifiers as any).engine} is not handled`,
        );
    }

    if (!method) {
      throw new InternalServerError(
        `This experiment (${params.connection.requestModifiers.engine}) is unsupported by ${params.connection.requestModifiers.experimentType}`,
      );
    }

    return method;
  }

  private getSQLOrMethod(params: ExperimentParams): SQLOrRequest {
    const requestConfig = params.request;
    if (requestConfig.type === 'raw') return requestConfig.sql;
    if (requestConfig.type === 'orm') return requestConfig.method;
  }
}

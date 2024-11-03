import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { faker } from '@faker-js/faker';
import { cloneDeep } from 'lodash';

import { UtilsService } from 'src/utils/utils.service';
import {
  CreateTreelikeClass,
  CreateTreelikeDepartmentDto,
  CreateTreelikeOptions,
  CreateTreelikeSQLOptions,
  DBRelation,
  RelationData,
  Schema,
  SqlModel,
  SqlModelClass,
  TableData,
  TableName,
} from './types';
import { ApiConfigService } from 'src/api-config/api-config.service';

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

import { InjectModel as InjectModelMongo } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { v4 } from 'uuid';
import { Sequelize } from 'sequelize';
import * as fs from 'fs/promises';
import { DbEngine } from 'src/types';
import { ExperimentEnvironment } from 'src/experiment/types';

@Injectable()
export class SeedsService {
  private readonly l = new Logger(SeedsService.name);
  private schema: Schema;

  private sqInstance: {
    [ExperimentEnvironment.LOCAL]: {
      [DbEngine.postgres]: Sequelize;
      [DbEngine.mysql]: Sequelize;
      [DbEngine.mssql]: Sequelize;
      [DbEngine.oracle]: Sequelize;
      [DbEngine.mariadb]: Sequelize;
    };
    [ExperimentEnvironment.REMOTE]: {
      [DbEngine.postgres]: Sequelize;
      [DbEngine.mysql]: Sequelize;
      [DbEngine.mssql]: Sequelize;
      [DbEngine.oracle]: Sequelize;
      [DbEngine.mariadb]: Sequelize;
    };
  };

  constructor(
    private readonly configService: ApiConfigService,
    private readonly utilsService: UtilsService,

    @InjectConnection('postgres') private readonly sqPostgres: Sequelize,
    @InjectConnection('mysql') private readonly sqMysql: Sequelize,
    @InjectConnection('mssql') private readonly sqMssql: Sequelize,
    @InjectConnection('oracledb') private readonly sqOracledb: Sequelize,
    @InjectConnection('mariadb') private readonly sqMariadb: Sequelize,

    @InjectConnection('postgres_remote')
    private readonly sqPostgresRemote: Sequelize,
    @InjectConnection('mysql_remote') private readonly sqMysqlRemote: Sequelize,
    @InjectConnection('mssql_remote') private readonly sqMssqlRemote: Sequelize,
    @InjectConnection('oracledb_remote')
    private readonly sqOracledbRemote: Sequelize,
    @InjectConnection('mariadb_remote')
    private readonly sqMariadbRemote: Sequelize,

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

    // Mongo
    @InjectModelMongo(Department.name)
    private departmentModelMongo: MongoModel<Department>,
  ) {
    this.schema = {
      Department: {
        mongoModel: this.departmentModelMongo,
        sqlModel: {
          [ExperimentEnvironment.LOCAL]: {
            [DbEngine.postgres]: this.departmentPostgresModel,
            [DbEngine.mysql]: this.departmentMySQLModel,
            [DbEngine.mssql]: this.departmentMsSQLModel,
            [DbEngine.oracle]: this.departmentOracleDbModel,
            [DbEngine.mariadb]: this.departmentMariaDbModel,
          },
          [ExperimentEnvironment.REMOTE]: {
            [DbEngine.postgres]: this.departmentPostgresRemoteModel,
            [DbEngine.mysql]: this.departmentMySQLRemoteModel,
            [DbEngine.mssql]: this.departmentMsSQLRemoteModel,
            [DbEngine.oracle]: this.departmentOracleDbRemoteModel,
            [DbEngine.mariadb]: this.departmentMariaDbRemoteModel,
          },
        },
        defaults: {
          id: () => faker.string.uuid(),
          // name: () => `msyghfk198`,
          // zohoId: () => 'ng3f9kd6v,3hdl4gri',
          // parentId: null,
          // createdAt: new Date(),
          // updatedAt: new Date(),
          name: () => `${faker.person.jobTitle()}-${v4().substring(0, 10)}`,
          zohoId: () => faker.string.alphanumeric(18),
          parentId: null,
          createdAt: () => faker.date.anytime(),
          updatedAt: () => faker.date.anytime(),
        },
        relations: {
          subDepartments: {
            model: Department,
            foreignKey: 'parentId',
            relationType: DBRelation.hasMany,
          },
          // members: {
          //   model: User,
          //   foreignKey: 'departmentId',
          //   relationType: DBRelation.hasMany,
          // },
        },
      },
    };

    this.sqInstance = {
      [ExperimentEnvironment.LOCAL]: {
        [DbEngine.postgres]: sqPostgres,
        [DbEngine.mysql]: sqMysql,
        [DbEngine.mssql]: sqMssql,
        [DbEngine.oracle]: sqOracledb,
        [DbEngine.mariadb]: sqMariadb,
      },
      [ExperimentEnvironment.REMOTE]: {
        [DbEngine.postgres]: sqPostgresRemote,
        [DbEngine.mysql]: sqMysqlRemote,
        [DbEngine.mssql]: sqMssqlRemote,
        [DbEngine.oracle]: sqOracledbRemote,
        [DbEngine.mariadb]: sqMariadbRemote,
      },
    };
  }

  public async cleanSQL(params: {
    type: 'sql';
    dbEngine: DbEngine;
    env: ExperimentEnvironment;
    connectionCreds: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      service?: string;
    };
  }) {
    this.l.log(`--- Clearing the database ---`);

    const tableNames: string[] = ['Department', 'SequelizeMeta'];

    for (const tableName of tableNames) {
      try {
        //
        // For my SQL CASCADE is not supported, so we will have to disable foreign key checks before
        if (params.dbEngine === 'mysql') {
          await this.sqInstance[params.env][params.dbEngine].query(
            `SET FOREIGN_KEY_CHECKS = 0`,
          );
        }

        if (params.dbEngine === 'postgres') {
          await this.sqInstance[params.env][params.dbEngine].query(
            `DROP TABLE IF EXISTS "${tableName}" CASCADE;`,
          );
        } else if (
          params.dbEngine === 'mysql' ||
          params.dbEngine === 'mariadb'
        ) {
          await this.sqInstance[params.env][params.dbEngine].query(
            `DROP TABLE IF EXISTS ${tableName};`,
          );
        } else if (params.dbEngine === 'mssql') {
          await this.sqInstance[params.env][params.dbEngine].query(
            `DROP TABLE IF EXISTS "${tableName}";`,
          );
        } else if (params.dbEngine === 'oracle') {
          await this.sqInstance[params.env][params.dbEngine].query(
            `DROP TABLE "${tableName}" CASCADE CONSTRAINTS;`,
          );
        } else {
          throw new Error('Drop tables unsupported');
        }

        if (params.dbEngine === 'mysql') {
          await this.sqInstance[params.env][params.dbEngine].query(
            `SET FOREIGN_KEY_CHECKS = 1`,
          );
        }
      } catch (error) {
        if (!/does not exist/gi.test(error.message)) {
          throw error;
        }

        // console.log('@error');
        // console.log(error);
        // console.log(JSON.stringify(error, null, 2));
      }
    }

    let str = '';
    for (const [key, value] of Object.entries(params.connectionCreds)) {
      str += `SCRIPT_DB_${key.toUpperCase()}=${value} `;
    }

    try {
      await this.utilsService.spawnChild(
        `DB_TO_MIGRATE=${params.dbEngine}${params.env === ExperimentEnvironment.REMOTE ? ` IS_REMOTE=true` : ' '} IS_SCRIPT=true ${str} yarn run db:migrate:up`,
      );
    } catch (error) {
      console.log('@error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  public async createTreelike(
    argEntities: CreateTreelikeClass[],
    { argDepth, reparse, dbEngine, env }: CreateTreelikeSQLOptions = {
      dbEngine: DbEngine.postgres,
      env: ExperimentEnvironment.LOCAL,
    },
  ): Promise<Array<any>> {
    const depth = argDepth || 0;

    let entities = argEntities;
    if (depth === 0) {
      entities = cloneDeep(entities);
    }

    const createdInstances = [];

    const bulkCreateData = [];

    // Get the DB sequelize model of this entity
    const modelInfo: TableData = this.schema[
      entities[0].__type__ as TableName
    ] as unknown as any;

    for (const entity of entities) {
      bulkCreateData.push({
        ...this.resolveDefaults(modelInfo.defaults),
        ...entity,
      });
    }

    // Create the entity
    let createdEntities: any[] = [];
    try {
      createdEntities = await modelInfo.sqlModel[env][
        dbEngine
      ].bulkCreate<SqlModelClass>(bulkCreateData, { returning: true });
    } catch (error) {
      //
      console.log('--- Entity creation error ---');
      console.log(fs.writeFile('./logs.txt', JSON.stringify(error, null, 2)));
    }

    const bulkCreateRelatedData = [];
    for (let e = 0; e < entities.length; e++) {
      const entity = entities[e];
      const createdEntity = createdEntities[e];

      // Get the DB sequelize model of this entity
      const relationsModelInfo: TableData<SqlModel, SqlModelClass> = this
        .schema[entity.__type__ as TableName].relations as unknown as any;

      // Loop over related models of current model
      for (const relModelKey of Object.keys(relationsModelInfo)) {
        const relatedModelName: string = Object.keys(entity).find(
          (key) => key === relModelKey,
        ) as any;

        // If relModelKey is not found on this entity, try another
        if (!relatedModelName) continue;

        // eslint-disable-next-line
        // @ts-ignore
        const relationData: RelationData = relationsModelInfo[
          relatedModelName
        ] as any as RelationData;
        const relatedEntities: CreateTreelikeClass[] = entity[
          relatedModelName as keyof CreateTreelikeClass
        ] as any;

        // Loop over related entities that we need to create
        for (const relatedEntity of relatedEntities) {
          // Parse special instructions
          if (
            relatedEntity[
              relationData.foreignKey as keyof CreateTreelikeClass
            ] === 'GET_FROM_PARENT'
          ) {
            relatedEntity[
              relationData.foreignKey as keyof CreateTreelikeClass
            ] = createdEntity.id;
          }

          // Recursively call create for related entity
          bulkCreateRelatedData.push({
            ...relatedEntity,
            [relationData.foreignKey]: createdEntity.id,
          });
        }
      }
    }

    if (bulkCreateRelatedData.length > 0) {
      await this.createTreelike(bulkCreateRelatedData, {
        argDepth: depth + 1,
        dbEngine,
        env,
      });
    }

    if (depth === 0 && reparse)
      return this.utilsService.reparse(createdInstances);

    return createdInstances;
  }
  private resolveDefaults(defaults: Record<string, any | (() => any)>) {
    const resolvedDefaults = {};
    for (const defaultKey of Object.keys(defaults)) {
      // eslint-disable-next-line
      // @ts-ignore
      resolvedDefaults[defaultKey] =
        typeof defaults[defaultKey] === 'function'
          ? defaults[defaultKey]()
          : defaults[defaultKey];
    }

    return resolvedDefaults;
  }

  /**
   * seedDepartmentsWithParents
   */
  public async seedDepartmentsWithParents({
    depsCount,
    subDepartmentsCount,
    db,
    env,
    connectionCreds,
    cleanup,
    data,
    nestedData,
    nestedKey,
  }: {
    depsCount: number;
    subDepartmentsCount: number;
    db:
      | {
          type: 'mongo';
        }
      | {
          type: 'sql';
          dbEngine: DbEngine;
        };
    env: ExperimentEnvironment;
    connectionCreds: any;
    cleanup?: boolean;
    data?: Partial<CreateTreelikeDepartmentDto>;
    nestedData?: Partial<CreateTreelikeDepartmentDto>;
    nestedKey?: string; // if this key is provided it will create each new Department recursively inside previous one
  }) {
    if (cleanup !== false) {
      this.l.log('--- Cleaning the DB ---');
      if (db.type === 'sql') {
        await this.cleanSQL({
          ...db,
          env,
          connectionCreds,
        });
      } else {
        await this.cleanMongo();
      }
    }

    this.l.log('--- Preparing seeds ---');

    const deps: CreateTreelikeDepartmentDto[] = [];

    for (let d = 0; d < depsCount; d++) {
      let mysql = '';
      if (db.type === 'sql' && db.dbEngine === DbEngine.mysql) {
        mysql = DbEngine.mysql;
      }

      const subDepartments: CreateTreelikeDepartmentDto[] =
        this.populateRelatedEntities({
          relatedEntityCount: subDepartmentsCount,
          entityIndex: d,
          nestedKey,
          populateObjMethod: () => ({
            __type__: TableName.Department,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            id: `${v4()}${mysql}`,
            ...nestedData,
            parentId: 'GET_FROM_PARENT',
          }),
        });
      deps.push({
        __type__: TableName.Department,
        // 1
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        id: `${v4()}${mysql}`,
        ...data,
        ...(subDepartments?.length > 0 && { subDepartments }),
      });
    }

    this.l.log('--- Inserting seeds into db ---');
    if (db.type === 'sql') {
      return await this.createTreelike(deps, { dbEngine: db.dbEngine, env });
    } else {
      return await this.createTreelikeMongo(deps);
    }
  }

  private populateRelatedEntities({
    relatedEntityCount,
    entityIndex,
    populateObjMethod,
    nestedKey,
  }: {
    relatedEntityCount: number;
    entityIndex: number;
    populateObjMethod: (...args: any[]) => any;
    nestedKey?: string;
  }): any {
    let localRelatedEntityCount = relatedEntityCount;
    const relatedEntities: CreateTreelikeClass[] = [];

    if (localRelatedEntityCount !== 0) {
      if (localRelatedEntityCount < 1) {
        let inverse = 1 / localRelatedEntityCount;

        if (localRelatedEntityCount === 0.333) inverse = 3;

        if (inverse % 1 !== 0) {
          throw new Error('Inorrect fraction');
        }

        // Skip if it's not the time to populate an object
        if ((entityIndex + 1) % inverse !== 0) return;

        localRelatedEntityCount = 1;
      }

      // If we have more users than deps, then use xUsersPerDep, otherwise use 1
      if (nestedKey !== undefined) {
        let rootEntity = null;
        let currEntity = null;
        for (let u = 0; u < localRelatedEntityCount; u++) {
          if (rootEntity === null) {
            rootEntity = populateObjMethod();
            currEntity = rootEntity;
            continue;
          }

          const newEntity = populateObjMethod();
          currEntity[nestedKey] = [newEntity];
          currEntity = newEntity;
        }

        relatedEntities.push(rootEntity);
      } else {
        for (let u = 0; u < localRelatedEntityCount; u++) {
          relatedEntities.push(populateObjMethod());
        }
      }
    }

    return relatedEntities;
  }

  public async cleanMongo() {
    this.l.log(`--- Clearing the database ---`);
    await this.departmentModelMongo.deleteMany({});
  }

  public async createTreelikeMongo(
    argEntities: CreateTreelikeClass[],
    { argDepth, reparse }: CreateTreelikeOptions = {},
  ): Promise<Array<any>> {
    const depth = argDepth || 0;

    let entities = argEntities;
    if (depth === 0) {
      entities = cloneDeep(entities);
    }

    const createdInstances = [];

    for (const entity of entities) {
      // Get the DB sequelize model of this entity
      const modelInfo: TableData = this.schema[
        entity.__type__ as TableName
      ] as unknown as any;
      const relationsModelInfo: TableData<SqlModel, SqlModelClass> = this
        .schema[entity.__type__ as TableName].relations as unknown as any;

      // Create the entity
      let createdInstance;
      const createRequest = {
        ...this.resolveDefaults(modelInfo.defaults),
        ...entity,
      };
      try {
        createdInstance =
          await modelInfo.mongoModel.create<SqlModelClass>(createRequest);
      } catch (error) {
        //
        console.log('--- Entity creation error: Mongo ---');
        console.log(error);
        console.log(JSON.stringify(error, null, 2));
      }

      // Loop over related models of current model
      for (const relModelKey of Object.keys(relationsModelInfo)) {
        const relatedModelName: string = Object.keys(entity).find(
          (key) => key === relModelKey,
        ) as any;

        // If relModelKey is not found on this entity, try another
        if (!relatedModelName) continue;

        // eslint-disable-next-line
        // @ts-ignore
        const relationData: RelationData = relationsModelInfo[
          relatedModelName
        ] as any as RelationData;
        const relatedEntities: CreateTreelikeClass[] = entity[
          relatedModelName as keyof CreateTreelikeClass
        ] as any;

        const createdRelatedInstances = [];
        // Loop over related entities that we need to create
        for (const relatedEntity of relatedEntities) {
          // Parse special instructions
          if (
            relatedEntity[
              relationData.foreignKey as keyof CreateTreelikeClass
            ] === 'GET_FROM_PARENT'
          ) {
            relatedEntity[
              relationData.foreignKey as keyof CreateTreelikeClass
            ] = createdInstance.id;
          }

          // Recursively call create for related entity
          const createdRelatedInstance = (
            await this.createTreelikeMongo(
              [
                {
                  ...relatedEntity,
                  [relationData.foreignKey]: createdInstance.id,
                },
              ],
              { argDepth: depth + 1 },
            )
          )[0];

          createdRelatedInstances.push(createdRelatedInstance);
        }

        createRequest[relatedModelName] = createdRelatedInstances;
      }

      try {
        await modelInfo.mongoModel.replaceOne(
          { _id: createdInstance._id },
          createRequest,
        );

        createdInstance = (
          await modelInfo.mongoModel.findById(createdInstance._id)
        ).toObject();
      } catch (error) {
        console.log('--- Entity creation error: Mongo ---');
        console.log(error);
        console.log(JSON.stringify(error, null, 2));
      }

      createdInstances.push(createdInstance);
    }

    if (depth === 0 && reparse)
      return this.utilsService.reparse(createdInstances);

    return createdInstances;
  }
}

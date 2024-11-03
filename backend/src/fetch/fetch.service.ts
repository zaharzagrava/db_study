import { Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/api-config/api-config.service';
import { UtilsService } from 'src/utils/utils.service';
import { QueryTypes } from 'sequelize';
import { InjectModel as InjectModelMongo } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import Department from 'src/models/department.model';
import { SeedsService } from 'src/seeds/seeds.service';
import { QueryGenerator } from 'sequelize/lib/dialects/abstract/query-generator';
import sequelizeErrors from 'sequelize/lib/errors';
import * as Utils from 'sequelize/lib/utils';
import * as _ from 'lodash';
import { PeriodValueService } from './period-value.service';
import { DbEngine } from 'src/types';
import { v4 } from 'uuid';

const __defProp = Object.defineProperty;
const __defProps = Object.defineProperties;
const __getOwnPropDescs = Object.getOwnPropertyDescriptors;
const __getOwnPropSymbols = Object.getOwnPropertySymbols;
const __hasOwnProp = Object.prototype.hasOwnProperty;
const __propIsEnum = Object.prototype.propertyIsEnumerable;
const __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value,
      })
    : (obj[key] = value);
const __spreadValues = (a, b) => {
  for (const prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (const prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
const __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

@Injectable()
export class FetchService {
  private readonly l = new Logger(FetchService.name);
  private queryGenerator: QueryGenerator;

  private depModel: {
    [DbEngine.postgres]: typeof Department;
    [DbEngine.mysql]: typeof Department;
    [DbEngine.mssql]: typeof Department;
    [DbEngine.oracle]: typeof Department;
    [DbEngine.mariadb]: typeof Department;
  };

  constructor(
    private readonly configService: ApiConfigService,
    private readonly periodValueService: PeriodValueService,
    private readonly seedsService: SeedsService,
    private readonly utilsService: UtilsService,

    @InjectModelMongo(Department.name)
    private departmentMongoModel: MongoModel<Department>,
  ) {}

  async mongoDbFetch() {
    try {
      return this.departmentMongoModel.find();
    } catch (error) {
      console.log('mongoDbFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchAllDeps(expTestRun: any) {
    try {
      const departmentsInfoModel =
        await this.depModel[expTestRun.dbEngine].findAll();

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsDepartmentsNoJoins(expTestRun: any) {
    try {
      const options = {
        raw: true,
      };

      const resp = await this.depModel[expTestRun.dbEngine].findAll(options);

      return resp;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsDepartmentsNoJoinsOrderBy(expTestRun: any) {
    try {
      const resp = await this.depModel[expTestRun.dbEngine].findAll({
        order: [['name', 'ASC']],
        raw: true,
      });

      return resp;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsWithSubDepartmentsInnerJoin(expTestRun: any) {
    try {
      const options = {
        include: [
          {
            model: Department,
            as: 'subDepartments',
            required: true,
          },
        ],
        raw: true,
      };

      const resp: any =
        await this.depModel[expTestRun.dbEngine].findAll(options);

      return resp;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  //
  async preprocess(
    options: any,
    { model, modelInstance }: { model: any; modelInstance: any },
  ) {
    if (options !== void 0 && !_.isPlainObject(options)) {
      throw new sequelizeErrors.QueryError(
        'The argument passed to findAll must be an options object, use findByPk if you wish to pass a single primary key value',
      );
    }
    if (options !== void 0 && options.attributes) {
      if (
        !Array.isArray(options.attributes) &&
        !_.isPlainObject(options.attributes)
      ) {
        throw new sequelizeErrors.QueryError(
          'The attributes option must be an array of column names or an object',
        );
      }
    }
    model.warnOnInvalidOptions(
      options,
      Object.keys(modelInstance.rawAttributes),
    );
    const tableNames = {};
    tableNames[(modelInstance.getTableName as any)(options) as any] = true;
    options = Utils.cloneDeep(options);
    if (
      options.transaction === void 0 &&
      (modelInstance.sequelize.constructor as any)._cls
    ) {
      const t = (modelInstance.sequelize.constructor as any)._cls.get(
        'transaction',
      );
      if (t) {
        options.transaction = t;
      }
    }
    _.defaults(options, { hooks: true });
    options.rejectOnEmpty = Object.prototype.hasOwnProperty.call(
      options,
      'rejectOnEmpty',
    )
      ? options.rejectOnEmpty
      : (modelInstance.options as any).rejectOnEmpty;
    model._injectScope(options);
    model._conformIncludes(options, this);
    model._expandAttributes(options);
    model._expandIncludeAll(options);
    options.originalAttributes = model._injectDependentVirtualAttributes(
      options.attributes,
    );
    if (options.include) {
      options.hasJoin = true;
      model._validateIncludedElements(options, tableNames);
      if (
        options.attributes &&
        !options.raw &&
        modelInstance.primaryKeyAttribute &&
        !options.attributes.includes(modelInstance.primaryKeyAttribute) &&
        (!options.group ||
          !options.hasSingleAssociation ||
          options.hasMultiAssociation)
      ) {
        options.attributes = [modelInstance.primaryKeyAttribute].concat(
          options.attributes,
        );
      }
    }
    if (!options.attributes) {
      options.attributes = Object.keys(modelInstance.rawAttributes);
      options.originalAttributes = model._injectDependentVirtualAttributes(
        options.attributes,
      );
    }
    (modelInstance.options as any).whereCollection = options.where || null;
    Utils.mapFinderOptions(options, model);
    options = model._paranoidClause(modelInstance, options);
    const selectOptions = __spreadProps(__spreadValues({}, options), {
      tableNames: Object.keys(tableNames),
    });

    return __spreadProps(__spreadValues({}, selectOptions), {
      type: QueryTypes.SELECT,
      model: modelInstance,
    });
  }

  // 27
  async postgresqlFetchDepsWithSubDepartmentsInnerJoinNoAttrs(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            attributes: [],
            model: Department,
            as: 'subDepartments',
            required: true,
          },
        ],
        raw: true,
      });

      // const groupedDepartments = JSON.parse(
      //   JSON.stringify(),
      // );

      // return _.groupBy(departmentsInfoModel, (obj) => obj.id);
      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  // 33
  async postgresqlFetchDepsWithSubDepartmentsInnerJoinNoAttrsFetchById(
    expTestRun: any,
  ) {
    const departmentsInfoModel = await this.depModel[
      expTestRun.dbEngine
    ].findAll({
      where: { id: v4() },
      include: [
        {
          attributes: [],
          model: Department,
          as: 'subDepartments',
          required: true,
        },
      ],
      raw: true,
    });

    return departmentsInfoModel;
  }

  // 34
  async postgresqlFetchDepsWithSubDepartmentsAllWithoutParentInner(
    expTestRun: any,
  ) {
    const departmentsInfoModel = await this.depModel[
      expTestRun.dbEngine
    ].findAll({
      include: [
        {
          attributes: [],
          model: Department.unscoped(),
          paranoid: false,
          as: 'subDepartments',
          required: true,
        },
      ],
      raw: true,
    });

    return departmentsInfoModel;
  }

  // 35
  async postgresqlFetchDepsWithSubDepartmentsAllWithoutParentLeft(
    expTestRun: any,
  ) {
    const departmentsInfoModel = await this.depModel[
      expTestRun.dbEngine
    ].findAll({
      where: { parentId: null },
      include: [
        {
          attributes: [],
          model: Department,
          as: 'subDepartments',
          required: false,
        },
      ],
      raw: true,
    });

    return departmentsInfoModel;
  }

  async postgresqlFetchDepsWithSubDepartments(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            model: Department,
            as: 'subDepartments',
            required: false,
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsWithSubDepartmentsNoAttrs(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            attributes: [],
            model: Department,
            as: 'subDepartments',
            required: false,
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  // 30
  async postgresqlFetchDepsWithSubDepartmentsNoAttrsOne(expTestRun: any) {
    try {
      // const rootDep = await this.findRootDepartment(expTestRun);

      // if (!rootDep) {
      // throw new InternalServerError('Not found');
      // }

      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        where: { id: v4() },
        include: [
          {
            attributes: [],
            model: Department,
            as: 'subDepartments',
            required: false,
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  public async findRootDepartment(expTestRun: any) {
    return await this.depModel[expTestRun.dbEngine].findOne({
      where: { parentId: null },
      raw: true,
    });
  }

  async postgresqlFetchDepsWithSubDepartmentsNested2(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            model: Department,
            as: 'subDepartments',
            required: true,
            include: [
              {
                model: Department,
                as: 'subDepartments',
                required: true,
              },
            ],
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsWithSubDepartmentsNested4_25(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            model: Department,
            as: 'subDepartments',
            required: true,
            include: [
              {
                model: Department,
                as: 'subDepartments',
                required: true,
                include: [
                  {
                    model: Department,
                    as: 'subDepartments',
                    required: true,
                    include: [
                      {
                        model: Department,
                        as: 'subDepartments',
                        required: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }

  async postgresqlFetchDepsWithSubDepartmentsNested4_26(expTestRun: any) {
    try {
      const departmentsInfoModel = await this.depModel[
        expTestRun.dbEngine
      ].findAll({
        include: [
          {
            model: Department,
            as: 'subDepartments',
            required: true,
            attributes: [],
            include: [
              {
                model: Department,
                as: 'subDepartments',
                required: true,
                attributes: [],
                include: [
                  {
                    model: Department,
                    as: 'subDepartments',
                    required: true,
                    include: [
                      {
                        model: Department,
                        as: 'subDepartments',
                        required: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
      });

      return departmentsInfoModel;
    } catch (error) {
      console.log('postgreSQLFetch error');
      console.log(error);
      console.log(JSON.stringify(error, null, 2));
    }
  }
}

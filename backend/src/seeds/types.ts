import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreationAttributes } from 'sequelize';
import { CreateDepartmentDto } from 'src/departments/types';
import { Model as MongoModel } from 'mongoose';
import { DbEngine } from 'src/types';
import Department from 'src/models/department.model';
import { ExperimentEnvironment } from 'src/experiment/types';

export type SqlModelClass = Department;

export type SqlModel = typeof Department;

export enum TableName {
  Department = 'Department',
}

export enum DBRelation {
  belongsTo = 'belongsTo',
  hasMany = 'hasMany',
  belongsToMany = 'belongsToMany',
}

export interface RelationData {
  model: SqlModel;
  through?: SqlModel;
  foreignKey: string;
  relationType: DBRelation;
}

export interface TableData<
  DbModelType extends SqlModel = typeof Department,
  DbModel extends SqlModelClass = Department,
> {
  sqlModel: {
    [ExperimentEnvironment.LOCAL]: {
      [DbEngine.postgres]: DbModelType;
      [DbEngine.mysql]: DbModelType;
      [DbEngine.mssql]: DbModelType;
      [DbEngine.oracle]: DbModelType;
      [DbEngine.mariadb]: DbModelType;
    };
    [ExperimentEnvironment.REMOTE]: {
      [DbEngine.postgres]: DbModelType;
      [DbEngine.mysql]: DbModelType;
      [DbEngine.mssql]: DbModelType;
      [DbEngine.oracle]: DbModelType;
      [DbEngine.mariadb]: DbModelType;
    };
  };
  mongoModel: MongoModel<any>;
  defaults: {
    [key in keyof CreationAttributes<DbModel>]: any | (() => any);
  };
  relations: {
    [relation in Exclude<string, 'sqlModel'>]: RelationData;
  };
}

export type Schema = {
  Department: TableData<typeof Department, Department>;
};

export class CreateTreelikeDepartmentDto extends PartialType(
  CreateDepartmentDto,
) {
  @ApiProperty()
  __type__: TableName.Department | 'GET_FROM_PARENT';

  @Type(() => CreateTreelikeDepartmentDto)
  @ApiProperty({
    type: CreateTreelikeDepartmentDto,
    isArray: true,
    example: ['CreateTreelikeDepartmentDto'],
  })
  subDepartments?: CreateTreelikeDepartmentDto[];
}

export type CreateTreelikeClass = CreateTreelikeDepartmentDto;

export interface CreateTreelikeOptions {
  argDepth?: number;
  reparse?: boolean;
}

export interface CreateTreelikeSQLOptions {
  argDepth?: number;
  reparse?: boolean;
  dbEngine: DbEngine;
  env: ExperimentEnvironment;
}

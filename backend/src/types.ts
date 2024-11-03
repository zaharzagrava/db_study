import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TimestampsFields {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date | null;
}

export class IdField {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: string;
}

export enum StringifiedBoolean {
  true = 'true',
  false = 'false',
}

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * @description
 *    - `develpoment` environment is used for active development, where PRs and actively merged into the branch. The branch should be called `development`
 *    - `staging` environment is used to execute regression testing before deploy to production. The branch is be called `staging`
 *    - `preprod` environment is used to investigate production-related bugs (usually related to prod-specific data)
 *        - it must has the same branch as production environment, and therefore deployed at the same time with prod.
 *    - `production` environment where users use actual application.
 *
 */
export enum Environment {
  local = 'local',
  test = 'test',
  development = 'development',
  staging = 'staging',
  preprod = 'preprod',
  production = 'production',
}

export const Environments = Object.values(Environment);

export enum DbEngine {
  postgres = 'postgres',
  mysql = 'mysql',
  mssql = 'mssql',
  oracle = 'oracle',
  mariadb = 'mariadb',
}

export type SQLOrRequest = string | ((...args: any) => any);

export interface DbConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  service?: string;
}

import { Module } from '@nestjs/common';
import { FetchService } from './fetch.service';
import Department, { DepartmentSchema } from 'src/models/department.model';
import { UtilsModule } from 'src/utils/utils.module';
import { ApiConfigModule } from 'src/api-config/api-config.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedsModule } from 'src/seeds/seeds.module';
import { PsqlService } from 'src/fetch/psql.service';
import { MsSQLService } from './mssql.service';
import { MySQLService } from './mysql.service';
import { MariaDBService } from './mariadb.service';
import { OracleDBService } from './oracledb.service';
import { PeriodValueService } from './period-value.service';
import { MathUtilsModule } from 'src/utils/math-utils/math-utils.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Department.name,
        schema: DepartmentSchema,
      },
    ]),

    SeedsModule,
    UtilsModule,
    ApiConfigModule,

    MathUtilsModule,
  ],
  providers: [
    FetchService,
    PsqlService,
    MsSQLService,
    MySQLService,
    MariaDBService,
    OracleDBService,

    PeriodValueService,
  ],
  exports: [
    FetchService,
    PsqlService,
    MsSQLService,
    MySQLService,
    MariaDBService,
    OracleDBService,
  ],
})
export class FetchModule {}

import { Module } from '@nestjs/common';
import { FetchModule } from 'src/fetch/fetch.module';
import { ExperimentService } from './experiment.service';
import { SeedsModule } from 'src/seeds/seeds.module';
import { UtilsModule } from 'src/utils/utils.module';
import { MathUtilsModule } from 'src/utils/math-utils/math-utils.module';
import { SequelizeModule } from '@nestjs/sequelize';
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
} from 'src/models/department.model';

@Module({
  imports: [
    FetchModule,
    SeedsModule,
    UtilsModule,
    MathUtilsModule,
    SequelizeModule.forFeature([DepartmentPostgres], 'postgres'),
    SequelizeModule.forFeature([DepartmentMySQL], 'mysql'),
    SequelizeModule.forFeature([DepartmentMsSQL], 'mssql'),
    SequelizeModule.forFeature([DepartmentOracleDb], 'oracledb'),
    SequelizeModule.forFeature([DepartmentMariaDb], 'mariadb'),

    SequelizeModule.forFeature([DepartmentPostgresRemote], 'postgres_remote'),
    SequelizeModule.forFeature([DepartmentMySQLRemote], 'mysql_remote'),
    SequelizeModule.forFeature([DepartmentMsSQLRemote], 'mssql_remote'),
    SequelizeModule.forFeature([DepartmentOracleDbRemote], 'oracledb_remote'),
    SequelizeModule.forFeature([DepartmentMariaDbRemote], 'mariadb_remote'),
  ],
  providers: [ExperimentService],
  controllers: [],
  exports: [ExperimentService],
})
export class ExperimentModule {}

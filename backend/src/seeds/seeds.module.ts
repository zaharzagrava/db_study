import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
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
  DepartmentSchema,
} from 'src/models/department.model';
import { UtilsModule } from 'src/utils/utils.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedsService } from './seeds.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Department.name,
        schema: DepartmentSchema,
      },
    ]),
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
    UtilsModule,
  ],
  providers: [SeedsService],
  controllers: [],
  exports: [SeedsService],
})
export class SeedsModule {}

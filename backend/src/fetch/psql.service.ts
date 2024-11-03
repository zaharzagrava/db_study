import { Injectable, Logger } from '@nestjs/common';
import * as Client from 'pg-native';
import {
  AggregatedStats,
  DBClientService,
  ExperimentMethodsMap,
  ExperimentStats,
  RequestStats,
} from './types';
import { DbConnection, SQLOrRequest } from 'src/types';
import { InternalServerError } from 'src/utils/types';
import { v4 } from 'uuid';
import { MathUtilsService } from 'src/utils/math-utils/math-utils.service';
import { ApiConfigService } from 'src/api-config/api-config.service';
import { ExperimentContext, ExperimentType } from 'src/experiment/types';

@Injectable()
export class PsqlService implements DBClientService {
  private readonly l = new Logger(PsqlService.name);

  private client: Client;

  public readonly experiments: ExperimentMethodsMap = {
    [ExperimentType.DEFAULT]: this.firstRowFetch.bind(this),
    [ExperimentType.EXPLAIN_ANALYZE]: this.explainAnalyze.bind(this),
  };

  constructor(
    private readonly mathUtilsService: MathUtilsService,
    private readonly configService: ApiConfigService,
  ) {}

  //   this.firstRowFetch({
  //     sqlOrRequest: `SELECT "Department"."id",
  //   "Department"."name",
  //   "Department"."zohoId",
  //   "Department"."parentId",
  //   "Department"."createdAt",
  //   "Department"."updatedAt",
  //   "Department"."deletedAt",
  //   "subDepartments"."id"        AS "subDepartments.id",
  //   "subDepartments"."name"      AS "subDepartments.name",
  //   "subDepartments"."zohoId"    AS "subDepartments.zohoId",
  //   "subDepartments"."parentId"  AS "subDepartments.parentId",
  //   "subDepartments"."createdAt" AS "subDepartments.createdAt",
  //   "subDepartments"."updatedAt" AS "subDepartments.updatedAt",
  //   "subDepartments"."deletedAt" AS "subDepartments.deletedAt"
  // FROM "Department" AS "Department"
  //     INNER JOIN "Department" AS "subDepartments"
  //                 ON "Department"."id" = "subDepartments"."parentId" AND ("subDepartments"."deletedAt" IS NULL)
  // WHERE ("Department"."deletedAt" IS NULL);`,
  //     connection: {
  //       host: this.configService.get('db_host'),
  //       port: Number(this.configService.get('db_port')),
  //       user: this.configService.get('db_username'),
  //       password: this.configService.get('db_password'),
  //       database: this.configService.get('db_name'),
  //     },
  //     context: {
  //       firstRowSd: true,
  //       firstRowMean: true,
  //       sd: true,
  //       mean: true,
  //       byRowSd: true,
  //       byRowMean: true,

  //       cacheClient: 'between-runs',
  //       returnData: false,
  //       runs: 10,
  //     },
  //   });

  //     client.on('drain', (...args: any[]) => {
  //       console.log('@drain');
  //       console.log(args);
  //     });
  //     client.on('end', (...args: any[]) => {
  //       console.log('@end');
  //       console.log(args);
  //     });
  //     client.on('error', (...args: any[]) => {
  //       console.log('@error');
  //       console.log(args);
  //     });
  //     client.on('notice', (...args: any[]) => {
  //       console.log('@notice');
  //       console.log(args);
  //     });
  //     client.on('notification', (...args: any[]) => {
  //       console.log('@notification');
  //       console.log(args);
  //     });

  async explainAnalyze({
    sqlOrRequest,
    connection,
    context,
  }: {
    sqlOrRequest: SQLOrRequest;
    connection: DbConnection;
    context: ExperimentContext;
  }): Promise<ExperimentStats> {
    return await this.executeRequest(
      connection,
      sqlOrRequest,
      context,
      'explain-analyze',
    );
  }

  async firstRowFetch({
    sqlOrRequest,
    connection,
    context,
  }: {
    sqlOrRequest: SQLOrRequest;
    connection: DbConnection;
    context: ExperimentContext;
  }): Promise<ExperimentStats> {
    return await this.executeRequest(
      connection,
      sqlOrRequest,
      context,
      'first-row',
    );
  }

  private async executeRequest(
    connection: DbConnection,
    sqlOrRequest: SQLOrRequest,
    context: ExperimentContext,
    mode: 'explain-analyze' | 'first-row',
  ): Promise<ExperimentStats> {
    if (typeof sqlOrRequest !== 'string') {
      throw new InternalServerError(`Cannot handle methods, only raw SQL`);
    }

    const requestsStats: RequestStats[] = [];
    for (let i = 0; i < (context.runs ?? 1); i++) {
      this.client = await this.resolveClient(context, connection);
      let from;
      let toFull;
      const res: {
        rows: any;
        result: any;
        stats: any;
      } = await new Promise((res, rej) => {
        const finalQuery = `${mode === 'explain-analyze' ? 'EXPLAIN ANALYSE\n' : ''}${sqlOrRequest}`;

        from = performance.now();
        this.client.query(finalQuery, function (err, rows, result, stats) {
          if (err) rej(err);

          toFull = performance.now();

          res({
            rows,
            result,
            stats,
          });
        });
      });

      const full = toFull - from;
      const firstRow = res.stats.firstRowReadTiming - from;
      this.l.log(
        `Request #${i + 1} run. Full = ${full}, First Row = ${firstRow}`,
      );

      requestsStats.push({
        rows: context.returnData ? res.rows : [],
        stats: {
          firstRow,
          full,
          byRowStats: res.stats.rowsTiming.map((x) => ({
            rowIndex: x.rowIndex,
            timing: x.timing - from,
          })),
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

  private async resolveClient(
    context: ExperimentContext,
    connection: DbConnection,
  ) {
    if (context.cacheClient === 'between-runs' && this.client) {
      this.l.log('Returning cached client');
      return this.client;
    }

    // If client is needed to be reconnected, first close previous one
    if (this.client) this.client.end();

    this.client = new Client({
      host: connection.host,
      port: connection.port,
      user: connection.user,
      password: connection.password,
      database: connection.database,
      ssl: {
        // require: true,
        rejectUnauthorized: false,
      },
    });

    await new Promise((res, rej) => {
      this.client.connect(
        // 'postgres://postgres:werwerwer@postgres-db-t3-xlarge.csyplpav5ylr.us-east-1.rds.amazonaws.com:5432/postgres',
        `postgres://${connection.user}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`,
        () => {
          res(1);
        },
      );
    });

    return this.client;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import * as oracledb from 'oracledb';
import {
  AggregatedStats,
  DBClientService,
  ExperimentMethodsMap,
  ExperimentStats,
  RequestStats,
} from './types';
import { DbConnection, SQLOrRequest } from 'src/types';
import { InternalServerError } from 'src/utils/types';
import { MathUtilsService } from 'src/utils/math-utils/math-utils.service';
import { v4 } from 'uuid';
import { ExperimentContext, ExperimentType } from 'src/experiment/types';

@Injectable()
export class OracleDBService implements DBClientService {
  private readonly l = new Logger(OracleDBService.name);

  private client: oracledb.Connection;

  public readonly experiments: ExperimentMethodsMap = {
    [ExperimentType.DEFAULT]: this.firstRowFetch.bind(this),
  };

  constructor(private readonly mathUtilsService: MathUtilsService) {}

  async firstRowFetch({
    sqlOrRequest,
    connection,
    context,
  }: {
    sqlOrRequest: SQLOrRequest;
    connection: DbConnection;
    context: ExperimentContext;
  }): Promise<ExperimentStats> {
    return await this.executeRequest(connection, sqlOrRequest, context);
  }

  async executeRequest(
    connection: DbConnection,
    sqlOrRequest: SQLOrRequest,
    context: ExperimentContext,
  ): Promise<ExperimentStats> {
    if (typeof sqlOrRequest !== 'string') {
      throw new InternalServerError(`Cannot handle methods, only raw SQL`);
    }

    const requestsStats: RequestStats[] = [];
    for (let i = 0; i < (context.runs ?? 1); i++) {
      this.client = await this.resolveClient(context, connection);

      const from = performance.now();
      const { rows, rowsTiming } = (await this.client.execute(
        sqlOrRequest as any,
      )) as any;
      const toFull = performance.now();

      let firstRowReadTiming;
      if (!rowsTiming?.[0]?.timing) {
        this.l.log(`Not a single row was returned, setting first row to full`);
        firstRowReadTiming = toFull;
      } else {
        firstRowReadTiming = rowsTiming[0].timing;
      }

      const full = toFull - from;
      const firstRow = firstRowReadTiming - from;
      this.l.log(
        `Request #${i + 1} run. Full = ${full}, First Row = ${firstRow}`,
      );

      requestsStats.push({
        rows: context.returnData ? rows : [],
        stats: {
          firstRow,
          full,
          byRowStats: rowsTiming.map((x) => ({
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
    if (this.client) this.client.close();

    return await oracledb.getConnection({
      password: connection.password,
      user: connection.user,
      connectString: `${connection.host}:${connection.port}/${connection.service}`,
    });
  }
}

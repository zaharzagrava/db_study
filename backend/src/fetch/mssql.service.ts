import { Injectable, Logger } from '@nestjs/common';
import { Connection, Request } from 'tedious';
import {
  AggregatedStats,
  ByRowStats,
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
export class MsSQLService implements DBClientService {
  private readonly l = new Logger(MsSQLService.name);

  private client: Connection;

  private cpuTime: number;
  private elapsedTime: number;
  private mode: 'set-statistics-on' | 'first-row';

  public readonly experiments: ExperimentMethodsMap = {
    [ExperimentType.DEFAULT]: this.firstRowFetch.bind(this),
    [ExperimentType.STATISTICS_ON]: this.setStatisticsOn.bind(this),
  };

  constructor(private readonly mathUtilsService: MathUtilsService) {}

  async setStatisticsOn({
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
      'set-statistics-on',
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

  async executeRequest(
    connection: DbConnection,
    sqlOrRequest: SQLOrRequest,
    context: ExperimentContext,
    mode: 'set-statistics-on' | 'first-row',
  ): Promise<ExperimentStats> {
    if (typeof sqlOrRequest !== 'string') {
      throw new InternalServerError(`Cannot handle methods, only raw SQL`);
    }

    const requestsStats: RequestStats[] = [];
    for (let i = 0; i < (context.runs ?? 1); i++) {
      this.client = await this.resolveClient(context, connection);

      const finalQuery = `${mode === 'set-statistics-on' ? 'SET STATISTICS TIME ON;\n' : ''}${sqlOrRequest}`;

      const res = await this.mssqlExecuteRequest(finalQuery);

      let firstRowReadTiming;
      if (!res.rowsTiming?.[0]?.timing) {
        this.l.log(`Not a single row was returned, setting first row to full`);
        firstRowReadTiming = res.full;
      } else {
        firstRowReadTiming = res.rowsTiming[0].timing;
      }

      const full = res.full - res.from;
      const firstRow = firstRowReadTiming - res.from;
      this.l.log(
        `Request #${i + 1} run. Full = ${full}, First Row = ${firstRow}`,
      );

      requestsStats.push({
        rows: context.returnData ? res.rows : [],
        stats: {
          firstRow,
          full,
          byRowStats: res.rowsTiming.map((x) => ({
            rowIndex: x.rowIndex,
            timing: x.timing - res.from,
          })),
          cpuTime: this.cpuTime,
          elapsedTime: this.elapsedTime,
        },
      });

      this.cpuTime = null;
      this.elapsedTime = null;
    }

    const aggregatedStats: AggregatedStats =
      this.mathUtilsService.getAggregatedStats(context, requestsStats);

    return {
      id: v4(),
      requestsStats,
      aggr: aggregatedStats,
    };
  }

  private async mssqlExecuteRequest(finalQuery: string) {
    const _l = this.l;

    let firstRow;
    let full;
    let from;
    const rows: any = [];
    const rowsTiming: ByRowStats[] = [];

    await new Promise((res, rej) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const request = new Request(finalQuery, function (...args) {
        // _l.log('MSSQL: Request callback fired');
        // _l.log(args);
      });

      request.on('requestCompleted', function () {
        // _l.log('MSSQL: requestCompleted event fired');
        full = performance.now();

        res(true);
      });

      let i = 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      request.on('row', function (row) {
        i++;
        if (i % 1000 === 0) {
          rowsTiming.push({
            rowIndex: i,
            timing: performance.now(),
          });
        }

        rows.push(row);
      });

      // request.on('done', function (rowCount, more, rows) {
      //   _l.log('MSSQL: done event fired');
      //   // _l.log(rowCount, more, rows);
      // });
      // request.on('doneProc', function (...args) {
      //   _l.log('MSSQL: doneProc event fired');
      //   // _l.log(args);
      // });
      // request.on('doneInProc', function (...args) {
      //   _l.log('MSSQL: doneInProc event fired');
      //   // _l.log(args);
      // });
      // request.on('returnValue', function (parameterName, value, metadata) {
      //   _l.log('MSSQL: returnValue event fired');
      //   // _l.log(parameterName, value, metadata);
      // });

      from = performance.now();
      this.client.execSql(request);
    });

    return { from, full, firstRow, rowsTiming, rows };
  }

  private async resolveClient(
    context: ExperimentContext,
    connection: DbConnection,
  ) {
    const _l = this.l;

    if (context.cacheClient === 'between-runs' && this.client) {
      this.l.log('Returning cached client');
      return this.client;
    }

    // If client is needed to be reconnected, first close previous one
    if (this.client) this.client.close();

    this.client = new Connection({
      server: connection.host,
      authentication: {
        type: 'default',
        options: {
          userName: connection.user,
          password: connection.password,
        },
      },
      // database: this.configService.get('ms_sql_db_name'),
      options: {
        database: connection.database,
        port: Number(connection.port),
        // encrypt: true, // for azure
        trustServerCertificate: true, // change to true for local dev / self-signed certs
      },
    });

    await new Promise((res, rej) => {
      this.client.on('connect', (err) => {
        if (err) {
          _l.error('Connection error:', err);
          rej(err);
          return;
        }

        _l.log('Connected to the database');
        res(true);
      });

      // client.on('debug', (msg: any) => {
      //   _l.log('MSSQL: debug');
      //   _l.log(msg);
      // });

      // TODO: make handler for errors, so that if anything goes wrong, it returns pretty error message
      this.client.on('infoMessage', (msg) => {
        // _l.log('MSSQL: infoMessage');

        if (this.mode === 'set-statistics-on' && msg?.message) {
          const alpha =
            /CPU time = ([0-9]+) ms,  elapsed time = ([0-9]+) ms/gi.exec(
              msg?.message,
            );

          if (!alpha) return;

          this.cpuTime = Number(alpha[1]);
          this.elapsedTime = Number(alpha[2]);
        }
      });

      // client.on('end', () => {
      //   _l.log('MSSQL: Connection closed');
      // });

      this.client.connect();
    });

    return this.client;
  }
}

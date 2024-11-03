import { ApiProperty } from '@nestjs/swagger';
import { ExperimentContext } from 'src/experiment/types';
import { DbConnection, SQLOrRequest } from 'src/types';

export class FetchParams {
  @ApiProperty()
  id?: string[];

  @ApiProperty()
  period?: number;

  userFilters?: UserFitlersDto;

  @ApiProperty()
  sortMode?: SortMode;

  @ApiProperty()
  filterMode?: FilterMode;

  @ApiProperty()
  metricAction?: MetricAction;
}

export class UserFitlersDto {
  @ApiProperty()
  id?: string | string[];

  @ApiProperty()
  departmentId?: string[];

  @ApiProperty()
  country?: string[] | string;

  @ApiProperty()
  legalLocation?: string[] | string;

  @ApiProperty()
  email?: string[] | string;

  @ApiProperty()
  fullName?: string[] | string;

  @ApiProperty()
  active?: boolean;
}

export enum FilterMode {
  BY_USER = 'BY_USER',
  BY_USER_METRICS = 'BY_USER_METRICS',
}

export enum SortMode {
  BY_USER = 'BY_USER',
  BY_USER_METRICS = 'BY_USER_METRICS',
}

export enum MetricAction {
  APPROVE = 'APPROVE',
  ADJUST = 'ADJUST',
  SUBMIT = 'SUBMIT',
}

export interface DBClientService {
  experiments: ExperimentMethodsMap;
}

export type ExperimentMethodsMap = {
  [key in string]: RequestRunner;
};

export interface ExperimentStats {
  id: string;
  requestsStats: RequestStats[];
  aggr: AggregatedStats;
}

export interface ExperimentResponse extends ExperimentStats {
  name: string;
  description: string;
  code: string;
}

export interface RequestStats {
  stats: {
    firstRow?: number;
    full?: number;
    byRowStats?: ByRowStats[];

    // returned for mssql STATISTICS_ON option instead of 'sd' and 'mean'
    cpuTime?: number;
    elapsedTime?: number;
  };
  rows: any[];
}

export interface AggregatedStats {
  firstRowSd?: number;
  firstRowMean?: number;
  sd?: number;
  mean?: number;
  byRowSd?: number;
  byRowMean?: number;

  // returned for mssql STATISTICS_ON option instead of 'sd' and 'mean'
  sd_cpuTime?: number;
  mean_cpuTime?: number;

  sd_elapsedTime?: number;
  mean_elapsedTime?: number;
}

export interface ByRowStats {
  rowIndex: number;
  timing: number;
}

export type RequestRunner = (params: {
  sqlOrRequest: SQLOrRequest;
  connection: DbConnection;
  context: ExperimentContext;
}) => Promise<ExperimentStats>;

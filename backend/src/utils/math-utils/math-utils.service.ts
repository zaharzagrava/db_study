import { Injectable } from '@nestjs/common';
import { ExperimentContext } from 'src/experiment/types';
import { AggregatedStats, RequestStats } from 'src/fetch/types';

@Injectable()
export class MathUtilsService {
  public mean(nums: number[]): number {
    return nums.reduce((sum, curr) => sum + curr, 0) / nums.length;
  }

  public sd(nums: number[]): number {
    const mean = this.mean(nums);

    return Math.sqrt(
      nums.reduce((sum, curr) => {
        return sum + Math.pow(curr - mean, 2);
      }, 0) / nums.length,
    );
  }

  private toFixed(num: number) {
    return Number(num.toFixed(0));
  }

  // prettier-ignore
  public getAggregatedStats(
    context: ExperimentContext,
    requestsStats: RequestStats[],
  ) {
    const aggregatedStats: AggregatedStats = {};

    if (context.mean) aggregatedStats.mean = this.toFixed(this.mean(requestsStats.map((x) => x.stats.full)));
    if (context.sd) aggregatedStats.sd = this.toFixed(this.sd(requestsStats.map((x) => x.stats.full)));
    if (context.firstRowSd) aggregatedStats.firstRowSd = this.toFixed(this.sd(requestsStats.map((x) => x.stats.firstRow)));
    if (context.firstRowMean) aggregatedStats.firstRowMean = this.toFixed(this.mean(requestsStats.map((x) => x.stats.firstRow)));

    const rowUploadTimes: number[] = [];
    for (const requestStats of requestsStats) {
      if(!requestStats.stats?.byRowStats?.length) continue;

      for (let i = 1; i < requestStats.stats.byRowStats.length - 1; i++) {
        const curr = requestStats.stats.byRowStats[i].timing;
        const next = requestStats.stats.byRowStats[i + 1].timing;

        rowUploadTimes.push(next - curr);
      }
    }

    if(rowUploadTimes.length !== 0) {
      if (context.byRowSd) aggregatedStats.byRowSd = this.toFixed(this.sd(rowUploadTimes));
      if (context.byRowMean) aggregatedStats.byRowMean = this.toFixed(this.mean(rowUploadTimes));
    }

    return aggregatedStats;
  }
}

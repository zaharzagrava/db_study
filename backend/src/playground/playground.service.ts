import { Injectable, Logger } from '@nestjs/common';

import { ExperimentService } from 'src/experiment/experiment.service';
import {
  ExperimentParams,
  RunExperimentInMapByKeyParams,
} from 'src/experiment/types';
import { ExperimentResponse, ExperimentStats } from 'src/fetch/types';
import { InternalServerError } from 'src/utils/types';

@Injectable()
export class PlaygroundService {
  private readonly l = new Logger(PlaygroundService.name);

  constructor(private readonly experimentService: ExperimentService) {}

  public async runExperimentInMapByKey(
    params: RunExperimentInMapByKeyParams,
  ): Promise<ExperimentResponse> {
    return await this.experimentService.runExperimentInMapByKey(params);
  }

  public async runExperiment(
    params: ExperimentParams[],
  ): Promise<ExperimentStats[]> {
    if (params.find((p) => p.request.type === 'orm')) {
      throw new InternalServerError(
        'You can only specify orm requests when calling runExperiment in-code',
      );
    }

    return await this.experimentService.runExperiment(params);
  }
}

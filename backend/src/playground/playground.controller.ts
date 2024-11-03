import { Body, Controller, Post } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { ExperimentResponse, ExperimentStats } from 'src/fetch/types';
import {
  ExperimentParams,
  RunExperimentInMapByKeyParams,
} from 'src/experiment/types';

@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @Post('experiment-map-call')
  async runExperimenInExperimentMap(
    @Body() params: RunExperimentInMapByKeyParams,
  ): Promise<ExperimentResponse> {
    return this.playgroundService.runExperimentInMapByKey(params);
  }

  @Post('experiment')
  async runExperiment(
    @Body() params: ExperimentParams[],
  ): Promise<ExperimentStats[]> {
    return this.playgroundService.runExperiment(params);
  }
}

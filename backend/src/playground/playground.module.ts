import { Module } from '@nestjs/common';
import { UtilsModule } from 'src/utils/utils.module';
import { ExperimentModule } from 'src/experiment/experiment.module';
import { PlaygroundService } from './playground.service';
import { PlaygroundController } from './playground.controller';

@Module({
  imports: [ExperimentModule, UtilsModule],
  providers: [PlaygroundService],
  controllers: [PlaygroundController],
  exports: [PlaygroundService],
})
export class PlaygroundModule {}

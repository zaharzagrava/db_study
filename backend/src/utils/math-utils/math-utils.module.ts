import { Module } from '@nestjs/common';
import { MathUtilsService } from './math-utils.service';

@Module({
  imports: [],
  providers: [MathUtilsService],
  exports: [MathUtilsService],
})
export class MathUtilsModule {}

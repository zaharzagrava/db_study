import { Module } from '@nestjs/common';
import { UtilsModule } from '../utils.module';
import { DateUtilsService } from './date-utils.service';

@Module({
  imports: [UtilsModule],
  providers: [DateUtilsService],
  exports: [DateUtilsService],
})
export class DateUtilsModule {}

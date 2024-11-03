import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { DateTime } from 'luxon';

@Injectable()
export class DateUtilsService {
  public add(date: Date, { months }: { months: number }): Date {
    const dateTime = DateTime.fromJSDate(date).plus({
      months,
    });
    return dateTime.toJSDate();
  }

  public subtract(date: Date, { months }: { months: number }): Date {
    const dateTime = DateTime.fromJSDate(date).minus({
      months,
    });

    return dateTime.toJSDate();
  }
}

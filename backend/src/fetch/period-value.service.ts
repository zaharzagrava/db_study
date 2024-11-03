import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class PeriodValueService {
  public format(period: number, format: string): string {
    const parsedPeriod = this.parsePeriodValue(period);

    return DateTime.fromObject({
      year: parsedPeriod[0],
      month: parsedPeriod[1],
    }).toFormat(format);
  }

  public add(period: number, { months }: { months: number }): number {
    const parsedPeriod = this.parsePeriodValue(period);

    const dateTime = DateTime.fromObject({
      year: parsedPeriod[0],
      month: parsedPeriod[1],
    }).plus({
      months,
    });

    return this.buildPeriodValue(dateTime.year, dateTime.month);
  }

  public subtr(period: number, { months }: { months: number }): number {
    const parsedPeriod = this.parsePeriodValue(period);

    const dateTime = DateTime.fromObject({
      year: parsedPeriod[0],
      month: parsedPeriod[1],
    }).minus({
      months,
    });

    return this.buildPeriodValue(dateTime.year, dateTime.month);
  }

  public buildPeriodValue(year: number, month: number): number {
    return year * 100 + month;
  }

  public parsePeriodValue(period: number): [year: number, month: number] {
    return [Math.floor(period / 100), period % 100];
  }

  public getPrevPeriodValue(period: number): number {
    const [year, month] = this.parsePeriodValue(period);
    if (month > 1) {
      return this.buildPeriodValue(year, month - 1);
    }

    return this.buildPeriodValue(year - 1, 12);
  }

  public getNextPeriodValue(period: number): number {
    const [year, month] = this.parsePeriodValue(period);
    if (month < 12) {
      return this.buildPeriodValue(year, month + 1);
    }

    return this.buildPeriodValue(year + 1, 1);
  }

  /**
   * Periods:
   *    1-3 (Jan - March) - 4
   *    4-6 (April - June) - 7
   *    7-9 (July - Sept) - 10
   *    10-12 (Oct - Dec) - 1
   *
   * @returns
   */
  public isPeriodAfterQuarterly(period: number) {
    return [1, 4, 7, 10].includes(period % 100);
  }

  /**
   * Periods:
   *    1-3 (Jan - March) - 4
   *    4-6 (April - June) - 7
   *    7-9 (July - Sept) - 10
   *    10-12 (Oct - Dec) - 1
   *
   * @returns
   */
  periodToQuarterLabel(period: number): string {
    // const year = period.toString()[2] + period.toString()[3];
    const year = Number(period.toString().substring(2, 4));
    switch (period % 100) {
      case 1:
        return `${year - 1}Q4`;
      case 4:
        return year + 'Q1';
      case 7:
        return year + 'Q2';
      case 10:
        return year + 'Q3';
    }

    return 'N/A';
  }
}

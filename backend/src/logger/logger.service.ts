import { ConsoleLogger } from '@nestjs/common';

export class Logger extends ConsoleLogger {
  createLg(tags: string[]) {
    return (message: any) => this.lg(message, tags);
  }

  lg(message: any, tags: string[]) {
    if (process.env.NODE_ENV === 'test') return;
    super.log(message);
  }

  error(exception: any) {
    if (process.env.NODE_ENV === 'test') return;
    super.error(JSON.stringify(exception, null, 2));
    super.error(exception.stack);
  }
}

import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { UtilsService } from 'src/utils/utils.service';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly utilsService: UtilsService) {
    super();
  }

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const { body, status } = this.utilsService.formatError(exception);

    response.status(status).json(body);
  }
}

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Model, BaseError as SequelizeBaseError } from 'sequelize';
import { BadRequestError, BaseError, ForbiddenError } from './types';
import * as _ from 'lodash';
import { spawn } from 'child_process';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);

  constructor() {}

  public sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async spawnChild(command: string) {
    const child = spawn(command, {
      shell: true,
    });

    let data = '';
    for await (const chunk of child.stdout) {
      // console.log('stdout chunk: ' + chunk);
      data += chunk;
    }
    let error = '';
    for await (const chunk of child.stderr) {
      console.error('stderr chunk: ' + chunk);
      error += chunk;
    }

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}, ${error}`);
    }
    return data;
  }

  /**
   * formatError
   */
  public formatError(exception: any) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof ForbiddenError
          ? 403
          : exception instanceof BadRequestError
            ? 400
            : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = {
      statusCode: status,
      message: exception.message ?? 'N/A',
      error: (() => {
        if (exception instanceof HttpException) {
          return exception.getResponse();
        } else if (exception instanceof BaseError) {
          return exception.toJSON();
        } else if (exception instanceof SequelizeBaseError) {
          return exception.name;
        } else {
          return exception;
        }
      })(),
    };

    return { body, status };
  }

  public omitByRecursively(
    value: any,
    {
      ignoreIteratee = (x) => x.prototype instanceof Model,
      iteratee = (x) =>
        _.isUndefined(x) ||
        _.isNull(x) ||
        _.isNaN(x) ||
        (_.isString(x) && _.isEmpty(x)),
    }: {
      ignoreIteratee?: (x: any) => boolean;
      iteratee?: (x: any) => boolean;
    } = {},
  ): any {
    if (_.isObject(value) && !ignoreIteratee(value)) {
      if (_.isArray(value)) {
        return _(value)
          .omitBy(iteratee)
          .map((v) => this.omitByRecursively(v, { iteratee, ignoreIteratee }))
          .value();
      } else {
        return _(value)
          .omitBy(iteratee)
          .mapValues((v, key) => {
            if (ignoreIteratee(key)) return v;
            return this.omitByRecursively(v, { iteratee, ignoreIteratee });
          })
          .value();
      }
    } else {
      return value;
    }
  }

  public reparse(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }
}

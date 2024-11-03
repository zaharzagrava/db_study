import { BaseError as SequelizeBaseError } from 'sequelize';

export const safeStringify = (obj: any, indent = 0) => {
  const cache: any[] = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === 'object' && value !== null
        ? cache.includes(value)
          ? '[Circular]' // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent,
  );
  return retVal;
};

export class BaseError extends Error {
  private data: any;
  private hrMessage: any;
  private causeErrors?: Error[];

  constructor(
    name: string,
    message: string,
    hrMessage?: string,
    params?: {
      data?: any;
      causeErrors?: Error[];
    },
  ) {
    super(message);

    this.name = `${name} ${message}`;
    this.hrMessage = hrMessage ?? '';
    this.data = params?.data;
    this.causeErrors = params?.causeErrors;
  }

  toJSON() {
    return {
      message: this.message,
      hrMessage: this.hrMessage,
      data: this.data,
      causeErrors: this.causeErrors?.map((causeError: Error): any => {
        if (causeError instanceof Error) {
          if (causeError instanceof SequelizeBaseError) {
            return causeError.name;
          } else if (!(causeError instanceof BaseError)) {
            return causeError.stack?.split('\n');
          } else {
            return causeError.toJSON();
          }
        }

        return causeError;
      }),
    };
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toHRString(envTab = ''): string {
    const childrenTab = envTab + '  ';
    let manyElems = false;
    let causeErrorsString = '';
    if (this.causeErrors === undefined || this.causeErrors?.length === 0) {
      causeErrorsString = '';
    } else {
      if (this.causeErrors.length > 1) {
        manyElems = true;
        causeErrorsString = this.causeErrors
          .map((causeError: any) => {
            if (causeError instanceof Error) {
              if (!(causeError instanceof BaseError)) {
                return `\n${childrenTab}${causeError.name} ${causeError.message}`;
              } else {
                return `\n${childrenTab}${causeError.toHRString(childrenTab)}`;
              }
            }

            return `\n${safeStringify(causeError)}}`;
          })
          .join('');
      } else {
        causeErrorsString = this.causeErrors
          .map((causeError: any) => {
            if (causeError instanceof Error) {
              if (!(causeError instanceof BaseError)) {
                return `, ${childrenTab}${causeError.name} ${causeError.message}`;
              } else {
                const prefix = causeError.hrMessage === '' ? '' : ', ';

                return `${prefix}${causeError.toHRString(envTab)}`;
              }
            }

            return `, ${safeStringify(causeError)}`;
          })
          .join('');
      }
    }

    return (
      this.hrMessage +
      (manyElems ? ', multiple errors: ' : '') +
      causeErrorsString
    );
  }
}

export class ForbiddenError extends BaseError {
  constructor(
    message: string,
    params?: {
      data?: any;
      hrMessage?: string;
      causeErrors?: Error[];
    },
  ) {
    super('Forbidden', message, params?.hrMessage, params);
  }
}

export class BadRequestError extends BaseError {
  constructor(
    message: string,
    params?: {
      data?: any;
      hrMessage?: string;
      causeErrors?: Error[];
    },
  ) {
    super('BadRequest', message, params?.hrMessage, params);
  }
}

export class InternalServerError extends BaseError {
  constructor(
    message: string,
    params?: {
      data?: any;
      hrMessage?: string;
      causeErrors?: Error[];
    },
  ) {
    super('InternalServerError', message, params?.hrMessage, params);
  }
}

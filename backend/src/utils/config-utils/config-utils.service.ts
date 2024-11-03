import { Injectable } from '@nestjs/common';
import * as joi from 'joi';

@Injectable()
export class ConfigUtilsService {
  public parseSrc<T>(
    config: Record<
      string,
      {
        name: string;
        postProcess?: (...args: any[]) => any;
        verify: joi.AnySchema;
      }
    >,
    srcs: Record<string, any>[],
  ): T {
    // Get
    const configValues: Partial<T> = {};
    for (const [key, configMeta] of Object.entries(config)) {
      configValues[key as keyof T] = this.getConfigVariable(
        configMeta.name,
        srcs,
      );
    }

    // Post-process
    for (const [key, configMeta] of Object.entries(config)) {
      if (configMeta.postProcess === undefined) continue;

      configValues[key as keyof T] = configMeta.postProcess(
        configValues[key as keyof T],
      );
    }

    // Validate
    const configValidationSchemaObj: Record<string, joi.AnySchema> = {};
    for (const [key, configMeta] of Object.entries(config)) {
      configValidationSchemaObj[key] = configMeta.verify;
    }

    const configValidationSchema: joi.ObjectSchema = joi.object(
      configValidationSchemaObj,
    );

    const { error } = configValidationSchema.validate(configValues, {
      allowUnknown: true,
      abortEarly: false,
    });

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    return configValues as T;
  }

  private getConfigVariable(
    name: string,
    srcs: Record<string, any>[],
  ): any | undefined {
    for (const src of srcs) {
      if (src[name] !== undefined) return src[name];
    }
  }
}

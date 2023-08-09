import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodError, Schema } from 'zod';

@Injectable()
export class CustomValidation implements PipeTransform {
  constructor(private schema: Schema) {}

  transform(value: any) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.issues);
      }

      throw new BadRequestException(error);
    }
  }
}

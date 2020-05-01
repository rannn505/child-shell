import { Argument } from 'core';
import { PS_TYPES_MAP } from './PSTypeConverter';

export class PSArgument extends Argument {
  constructor(value: unknown) {
    super(value, PS_TYPES_MAP);
  }
}

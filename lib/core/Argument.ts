import { convertTo, TypesMap, SObject } from './TypeConverter';

export class Argument {
  public readonly value: SObject;

  constructor(value: unknown);
  constructor(value: unknown, typesMap?: TypesMap);
  constructor(value: unknown, typesMap?: TypesMap) {
    this.value = convertTo(value, typesMap);
  }

  toString(): string {
    return this.value.toString();
  }
}

import { convertTo, TypesMap, SHObject } from './TypeConverter';

export class Argument {
  public readonly value: SHObject;

  constructor(value: unknown);
  constructor(value: unknown, typesMap?: Partial<TypesMap>);
  constructor(value: unknown, typesMap?: Partial<TypesMap>) {
    this.value = convertTo(value, typesMap);
  }

  toString(): string {
    return this.value.toString();
  }
}

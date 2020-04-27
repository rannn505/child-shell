import { convertTo, TypesMap, SObject, SUndefined } from './TypeConverter';

export type Dash = '-' | '--';

export class Parameter {
  public readonly dash: Dash;
  public readonly name: string;
  public readonly value: SObject;

  constructor(dash: Dash, name: string, value?: unknown);
  constructor(dash: Dash, name: string, value?: unknown, typesMap?: TypesMap);
  constructor(dash: Dash, name: string, value?: unknown, typesMap?: TypesMap) {
    this.dash = dash;
    this.name = name;
    this.value = convertTo(value, typesMap);
  }

  toString(): string {
    if (this.value instanceof SUndefined) {
      return `${this.dash}${this.name}`;
    }
    return `${this.dash}${this.name} ${this.value.toString()}`;
  }
}

import { convertTo, TypesMap, SHObject, SUndefined } from './TypeConverter';

export type Dash = '-' | '--';

export class Parameter {
  public readonly dash: Dash;
  public readonly name: string;
  public readonly value: SHObject;

  constructor(dash: Dash, name: string, value?: unknown);
  constructor(dash: Dash, name: string, value?: unknown, typesMap?: Partial<TypesMap>);
  constructor(dash: Dash, name: string, value?: unknown, typesMap?: Partial<TypesMap>) {
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

import { Types, toType } from '../common/utils';

export class PSOption {
  public name: string;
  public value: unknown; // string | boolean;

  constructor(name: string, value: unknown) {
    this.name = name;
    this.value = value;
  }

  toArray(): Array<string> {
    switch (toType(this.value)) {
      case Types.String:
        return [`-${this.name}`, this.value as string];
      case Types.Boolean:
        return (!this.value as boolean) ? [] : [`-${this.name}`];
      default:
        throw new TypeError('PSOption value must be string or boolean');
    }
  }
}

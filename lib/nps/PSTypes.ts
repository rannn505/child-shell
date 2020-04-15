import { Types, toType } from '../common/utils';

export class PSObject {
  protected readonly obj: unknown;

  constructor(obj: unknown) {
    this.obj = obj;
  }

  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  toString(): string {
    return this.obj.toString();
  }
}

export class PSString extends PSObject {
  toString(): string {
    const isIncludesDoubleQuotes = (this.obj as string).includes('"');

    if (isIncludesDoubleQuotes) {
      return `'${this.obj}'`;
    }
    return `"${this.obj}"`;
  }
}

export class PSBoolean extends PSObject {
  toString(): string {
    return (this.obj as boolean) ? '$True' : '$False';
  }
}

export class PSCustomObject extends PSObject {
  toString(): string {
    return `@${JSON.stringify(this.obj as Record<string, unknown>)
      .replace(/:/g, '=')
      .replace(/,/g, ';')}`;
  }
}

export class PSArray extends PSObject {
  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return (this.obj as []).map((el: unknown) => PSTypeConverter.convertToPSObject(el).toString()).join(',');
  }
}

export class PSDate extends PSObject {
  toString(): string {
    return (this.obj as Date).toLocaleString();
  }
}

export class PSNull extends PSObject {
  toString(): string {
    return '$Null';
  }
}

export class PSUndefined extends PSObject {
  toString(): string {
    return '';
  }
}

export class PSSwitch extends PSUndefined {}

const JS_TO_PS_TYPES_MAPPING: { [key in Types]: typeof PSObject } = {
  [Types.Number]: PSObject,
  [Types.String]: PSString,
  [Types.Boolean]: PSBoolean,
  [Types.Object]: PSCustomObject,
  [Types.Array]: PSArray,
  [Types.Date]: PSDate,
  [Types.Regexp]: PSString,
  [Types.Null]: PSNull,
  [Types.Undefined]: PSUndefined,
};

export class PSTypeConverter {
  static convertToPSObject<T>(obj: T): PSObject {
    const objType = toType(obj);
    const PSObjectClass = JS_TO_PS_TYPES_MAPPING[objType];
    if (!PSObjectClass) {
      throw new Error('type not found');
    }
    return new PSObjectClass(obj);
  }
}

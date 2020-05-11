import { Types, toType } from '@nsh/to-type';

interface IType {
  readonly value: unknown;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class SObject implements IType {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly value: unknown) {}

  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class SString extends SObject {
  toString(): string {
    const isIncludesDoubleQuotes = (this.value as string).includes('"');

    if (isIncludesDoubleQuotes) {
      return `'${this.value}'`;
    }
    return `"${this.value}"`;
  }
}

export class SBoolean extends SObject {}

export class SCustomObject extends SObject {
  toString(): string {
    return JSON.stringify(this.value as Record<string, unknown>);
  }
}

export class SArray extends SObject {
  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return (this.value as []).map((el: unknown) => convertTo(el).toString()).join(',');
  }
}

export class SDate extends SObject {
  toString(): string {
    return (this.value as Date).toLocaleString();
  }
}

export class SNull extends SObject {}

export class SUndefined extends SObject {
  toString(): string {
    return '';
  }
}

export type TypesMap = { [key in Types]: typeof SObject };

export const DEFAULT_TYPES_MAP: TypesMap = {
  [Types.Number]: SObject,
  [Types.String]: SString,
  [Types.Boolean]: SBoolean,
  [Types.Object]: SCustomObject,
  [Types.Array]: SArray,
  [Types.Date]: SDate,
  [Types.Regexp]: SString,
  [Types.Null]: SNull,
  [Types.Undefined]: SUndefined,
  [Types.Error]: SObject,
};

export const convertTo = (object: unknown, typesMap = DEFAULT_TYPES_MAP): SObject => {
  if (object instanceof SObject) {
    return object;
  }

  const typeString = toType(object);

  const ObjectClass = typesMap[typeString];
  if (!ObjectClass) {
    throw new Error('Type not found');
  }
  return new ObjectClass(object);
};

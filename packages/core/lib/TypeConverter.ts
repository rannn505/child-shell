import { Types, toType } from '@nbsh/to-type';

interface IType {
  readonly value: unknown;
  readonly [Symbol.toStringTag]: string;
  toString(): string;
}

export class SHObject implements IType {
  // eslint-disable-next-line no-useless-constructor
  constructor(readonly value: unknown) {}

  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class SString extends SHObject {
  toString(): string {
    const isIncludesDoubleQuotes = (this.value as string).includes('"');

    if (isIncludesDoubleQuotes) {
      return `'${this.value}'`;
    }
    return `"${this.value}"`;
  }
}

export class SCustomObject extends SHObject {
  toString(): string {
    return JSON.stringify(this.value as Record<string, unknown>);
  }
}

export class SArray extends SHObject {
  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return (this.value as []).map((el: unknown) => convertTo(el).toString()).join(',');
  }
}

export class SNull extends SHObject {
  toString(): string {
    return 'null';
  }
}

export class SUndefined extends SHObject {
  toString(): string {
    return '';
  }
}

export type TypesMap = { [key in Types]: typeof SHObject };

export const DEFAULT_TYPES_MAP: TypesMap = {
  [Types.Symbol]: SHObject,
  [Types.Number]: SHObject,
  [Types.BigInt]: SHObject,
  [Types.String]: SString,
  [Types.Boolean]: SHObject,
  [Types.Undefined]: SUndefined,
  [Types.Null]: SNull,
  [Types.Object]: SCustomObject,
  [Types.Array]: SArray,
  [Types.Unit]: SHObject,
  [Types.Date]: SHObject,
  [Types.Map]: undefined,
  [Types.WeakMap]: undefined,
  [Types.Set]: undefined,
  [Types.WeakSet]: undefined,
  [Types.Regexp]: SString,
  [Types.Error]: undefined,
  [Types.Function]: undefined,
  [Types.Arguments]: undefined,
  [Types.JSON]: undefined,
  [Types.Math]: undefined,
  [Types.Global]: undefined,
};

export const convertTo = (object: unknown, typesMap: Partial<TypesMap> = {}): SHObject => {
  if (object instanceof SHObject) {
    return object;
  }

  const typeString = toType(object) as Types;

  const ObjectClass = { ...DEFAULT_TYPES_MAP, ...typesMap }[typeString];
  if (!ObjectClass) {
    throw new Error('Type not found');
  }
  return new ObjectClass(object);
};

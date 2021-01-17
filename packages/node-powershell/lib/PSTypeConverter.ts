import { convertTo, TypesMap, SHObject, SCustomObject, SArray, SNull } from 'child-shell';
import { Types } from '@nbsh/to-type';

export class PSBoolean extends SHObject {
  toString(): string {
    return (this.value as boolean) ? '$True' : '$False';
  }
}

export class PSCustomObject extends SCustomObject {
  toString(): string {
    return `@${super.toString().replace(/:/g, '=').replace(/,/g, ';')}`;
  }
}

export class PSArray extends SArray {
  toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return (this.value as []).map((el: unknown) => convertTo(el, PS_TYPES_MAP).toString()).join(',');
  }
}

export class PSDate extends SHObject {
  toString(): string {
    return (this.value as Date).toLocaleString();
  }
}

export class PSNull extends SNull {
  toString(): string {
    return '$Null';
  }
}

export class PSError extends SHObject {}

export const PS_TYPES_MAP: Partial<TypesMap> = {
  [Types.Boolean]: PSBoolean,
  [Types.Object]: PSCustomObject,
  [Types.Array]: PSArray,
  [Types.Date]: PSDate,
  [Types.Null]: PSNull,
  [Types.Error]: PSError,
};

import {
  convertTo,
  TypesMap,
  SObject,
  SString,
  SBoolean,
  SCustomObject,
  SArray,
  SDate,
  SNull,
  SUndefined,
} from '../core/TypeConverter';
import { Types } from '../core/utils';

export class PSNumber extends SObject {}

export class PSString extends SString {}

export class PSBoolean extends SBoolean {
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

export class PSDate extends SDate {}

export class PSNull extends SNull {
  toString(): string {
    return '$Null';
  }
}

export class PSUndefined extends SUndefined {}

export class PSError extends SObject {}

export const PS_TYPES_MAP: TypesMap = {
  [Types.Number]: PSNumber,
  [Types.String]: PSString,
  [Types.Boolean]: PSBoolean,
  [Types.Object]: PSCustomObject,
  [Types.Array]: PSArray,
  [Types.Date]: PSDate,
  [Types.Regexp]: PSString,
  [Types.Null]: PSNull,
  [Types.Undefined]: PSUndefined,
  [Types.Error]: PSError,
};

export type JavaScriptTypes =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'buffer'
  | 'number'
  | 'string'
  | 'arguments'
  | 'object'
  | 'date'
  | 'array'
  | 'regexp'
  | 'error'
  | 'function'
  | 'generatorfunction'
  | 'symbol'
  | 'map'
  | 'weakmap'
  | 'set'
  | 'weakset'
  | 'int8array'
  | 'uint8array'
  | 'uint8clampedarray'
  | 'int16array'
  | 'uint16array'
  | 'int32array'
  | 'uint32array'
  | 'float32array'
  | 'float64array';

export type Converter = (object: unknown, convert: ConvertFn) => string;

export type Converters = Map<JavaScriptTypes, Converter>;

export type ConvertFn = (object: unknown, converters?: Converters) => string;

const emptyConverter: Converter = () => '';
const primitiveConverter: Converter = (object) => object.toString();
const stringConverter: Converter = (object) => {
  const hasDoubleQuotes = (object as string).includes('"');
  if (hasDoubleQuotes) {
    return `'${object}'`;
  }
  return `"${object}"`;
};
const objectConverter: Converter = (object) => JSON.stringify(object);
const arrayConverter: Converter = (object, convert) =>
  (object as unknown[]).map((el: unknown) => convert(el)).join(',');

export const SHELL_CONVERTERS: Converters = new Map([
  ['undefined', emptyConverter],
  ['null', emptyConverter],
  ['boolean', primitiveConverter],
  ['number', primitiveConverter],
  ['string', stringConverter],
  ['object', objectConverter],
  ['date', primitiveConverter],
  ['array', arrayConverter],
  ['regexp', stringConverter],
  ['symbol', primitiveConverter],
  // [TBD] add default converts for for: map, weakmap, set, weakset
]);

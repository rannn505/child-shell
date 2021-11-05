import kindOf from 'kind-of';

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

const DEFAULT_CONVERTERS: Converters = new Map([
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

export const convertJsObjToShellStr = (object: unknown, extraConverters: Converters = new Map([])): string => {
  const converters = new Map([...DEFAULT_CONVERTERS, ...extraConverters]);
  const objectType = kindOf(object) as JavaScriptTypes;
  const hasConverter = converters.has(objectType);
  if (!hasConverter) {
    throw new Error(`cannot convert ${objectType} object to its shell representation`);
  }
  return converters.get(objectType).call(undefined, object, convertJsObjToShellStr);
};

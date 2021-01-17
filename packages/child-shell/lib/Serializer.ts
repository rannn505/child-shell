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

export type SerializeFunction = (object: unknown, serializer: Serializer) => string;

export type SerializeMap = Map<JavaScriptTypes, SerializeFunction>;

const serializePrimitive: SerializeFunction = (object) => object.toString();

const serializeString: SerializeFunction = (object) => {
  const hasDoubleQuotes = (object as string).includes('"');
  if (hasDoubleQuotes) {
    return `'${object}'`;
  }
  return `"${object}"`;
};

export const DEFAULT_SERIALIZE_MAP: SerializeMap = new Map([
  ['undefined', () => ''],
  ['null', () => 'null'],
  ['boolean', serializePrimitive],
  ['number', serializePrimitive],
  ['string', serializeString],
  ['object', (object) => JSON.stringify(object)],
  ['date', serializePrimitive],
  [
    'array',
    (object, serializer) => {
      return (object as unknown[]).map((el: unknown) => serializer.serialize(el)).join(',');
    },
  ],
  ['regexp', serializeString],
  ['symbol', serializePrimitive],
  // [TBD] add support for: map, weakmap, set, weakset
]);

export class Serializer {
  constructor(protected readonly serializeMap: SerializeMap = DEFAULT_SERIALIZE_MAP) {}

  serialize(object: unknown): string {
    const objectType = kindOf(object) as JavaScriptTypes;
    const hasSerializeMethod = objectType === 'object' && typeof (object as Record<any, any>).serialize === 'function';
    if (hasSerializeMethod) {
      const serializedObject = (object as Record<any, any>).serialize();
      if (kindOf(serializedObject) !== 'string') {
        throw new Error('Object serializer must return a string');
      }
      return serializedObject;
    }
    const hasSerializerInMap = this.serializeMap.has(objectType);
    if (hasSerializerInMap) {
      return this.serializeMap.get(objectType)(object, this);
    }
    throw new Error(`There is no serializer to a ${objectType} object`);
  }
}

import kindOf from 'kind-of';
import { Converter, Converters, TypeConverter } from './TypeConverter';

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

export type JavaScriptConverter = Converter<JavaScriptTypes, string>;

export type JavaScriptConverters = Converters<JavaScriptTypes, string>;

export class JavaScriptTypeConverter extends TypeConverter<JavaScriptTypes, string> {
  constructor(converters: JavaScriptConverters = new Map()) {
    const emptyConvert: JavaScriptConverter = function () {
      return '';
    };

    const convertPrimitive: JavaScriptConverter = function (object) {
      return object.toString();
    };

    const convertString: JavaScriptConverter = function (object) {
      const hasDoubleQuotes = (object as string).includes('"');
      if (hasDoubleQuotes) {
        return `'${object}'`;
      }
      return `"${object}"`;
    };

    const convertObject: JavaScriptConverter = function (object) {
      return JSON.stringify(object);
    };

    const convertArray: JavaScriptConverter = function (object) {
      return (object as unknown[]).map((el: unknown) => this.convert(el)).join(',');
    };

    super(
      new Map([
        ['undefined', emptyConvert],
        ['null', emptyConvert],
        ['boolean', convertPrimitive],
        ['number', convertPrimitive],
        ['string', convertString],
        ['object', convertObject],
        ['date', convertPrimitive],
        ['array', convertArray],
        ['regexp', convertString],
        ['symbol', convertPrimitive],
        // [TBD] add default converts for for: map, weakmap, set, weakset
        ...converters,
      ]),
    );
  }

  protected getType(object: unknown): JavaScriptTypes {
    return kindOf(object) as JavaScriptTypes;
  }
}

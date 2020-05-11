export enum Types {
  Symbol = 'symbol',
  Number = 'number',
  BigInt = 'bigint',
  String = 'string',
  Boolean = 'boolean',
  Undefined = 'undefined',
  Null = 'null',
  Object = 'object',
  Array = 'array',
  Unit = 'uint',
  Date = 'date',
  Map = 'map',
  WeakMap = 'weakmap',
  Set = 'set',
  WeakSet = 'weakset',
  Regexp = 'regexp',
  Error = 'error',
  Function = 'function',
  Arguments = 'arguments',
  JSON = 'json',
  Math = 'math',
  Global = 'global',
}

export const toType = ((global: unknown) => {
  return (object: unknown): string => {
    if (object === global) {
      return Types.Global;
    }
    return {}.toString
      .call(object)
      .match(/\s([a-zA-Z]+)/)[1]
      .toLowerCase();
  };
})(this);

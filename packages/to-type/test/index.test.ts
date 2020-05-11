import { toType, Types } from '../lib';

describe('to-type', () => {
  const examples = [
    [Symbol('sym'), Types.Symbol],
    [4, Types.Number],
    [BigInt(4), Types.BigInt],
    ['abc', Types.String],
    [true, Types.Boolean],
    [undefined, Types.Undefined],
    [null, Types.Null],
    [{ a: 4 }, Types.Object],
    [[1, 2, 3], Types.Array],
    [Buffer.from(''), Types.Unit],
    [new Date(), Types.Date],
    [new Map(), Types.Map],
    [new WeakMap(), Types.WeakMap],
    [new Set(), Types.Set],
    [new WeakSet(), Types.WeakSet],
    [/a-z/, Types.Regexp],
    [new TypeError(), Types.Error],
    [(): void => {}, Types.Function],
    // eslint-disable-next-line prettier/prettier, prefer-rest-params
    [(function fn(): IArguments { return arguments })(), Types.Arguments],
    [JSON, Types.JSON],
    [Math, Types.Math],
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test.each(examples)('toType(%p)', (object: any, expected: string) => {
    expect(toType(object)).toBe(expected);
  });
});

# `to-type`

> Fixes JavaScript typeof operator using Symbol.toStringTag

## Installation

```bash
$ npm i -S @nbsh/to-type
$ yarn add @nbsh/to-type
```

## Usage

```js
import { strictEqual } from 'assert';
import { toType, Types } from '@nbsh/to-type';

toType(4); // "number"
toType('abc'); // "string"
toType(true); // "boolean"
toType({ a: 4 }); // "object"
toType([1, 2, 3]); // "array"
toType(new Date()); // "date"
toType(/a-z/); // "regexp"
toType(undefined); // "undefined"
toType(null); // "null"
toType(new TypeError()); // "error"
toType(() => {}); // "function"

strictEqual(toType(4), Types.Number); // true
strictEqual(toType('abc'), Types.String); // true
```

## API

### `toType(object: unknown): string`

The `toType()` method return the default string description of the object it receive as argument. `toType()` do not affect the object itself.
See [Symbol.toStringTag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag).

### `Types: enum`

The `Types` enum represent the [well-known](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures) string descriptions that `toType()` method return. **Note**, implementing a class that overrides the toStringTab symbol will not make its value available within this enum.

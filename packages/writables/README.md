# `writables`

> Useful implementations for writable stream

## Installation

```bash
$ npm i -S @nbsh/writables
$ yarn add @nbsh/writables
```

## Usage

```js
import { createReadStream } from 'fs';
import { once } from 'events';
import { AccumulateStream, RotateStream, DomainStream, DOMAIN_EVENT, ROTATE_EVENT } from '@nbsh/writables';

(async (): void => {
  // file.txt: (2kb)
  // @nbsh/writables
  // streams are awesome. streams are awesome.
  // streams are awesome. streams are awesome.
  // ... ...
  // @nbsh/writables
  const readable = createReadStream('file.txt');

  const acc = new AccumulateStream();
  const rot = new RotateStream({ size: '1kb', count: 2 });
  const dom = new DomainStream('@nbsh/writables');

  readable.pipe(acc);
  readable.pipe(rot);
  readable.pipe(dom);

  // will be emitted every 1kb and 2 writes
  rot.on(ROTATE_EVENT, () => console.log(rot.getContent().toString()));

  // will be emitted when '@nbsh/writables' written for the second time
  await once(dom, DOMAIN_EVENT);

  console.log(acc.getContent().toString());
})();
```

## [TBD]: API

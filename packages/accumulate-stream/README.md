# `accumulate-stream`

> Useful implementations for writable stream

## Installation

```bash
$ npm i -S accumulate-stream
$ yarn add accumulate-stream
```

## Usage

```js
import { createReadStream } from 'fs';
import { once } from 'events';
import { AccumulateStream, RotateStream, DomainStream, DOMAIN_EVENT, ROTATE_EVENT } from 'accumulate-stream';

(async (): void => {
  // file.txt: (2kb)
  // accumulate-stream
  // streams are awesome. streams are awesome.
  // streams are awesome. streams are awesome.
  // ... ...
  // accumulate-stream
  const readable = createReadStream('file.txt');

  const acc = new AccumulateStream();
  const rot = new RotateStream({ size: '1kb', count: 2 });
  const dom = new DomainStream('accumulate-stream');

  readable.pipe(acc);
  readable.pipe(rot);
  readable.pipe(dom);

  // will be emitted every 1kb and 2 writes
  rot.on(ROTATE_EVENT, () => console.log(rot.getContent().toString()));

  // will be emitted when 'accumulate-stream' written for the second time
  await once(dom, DOMAIN_EVENT);

  console.log(acc.getContent().toString());
})();
```

## [TBD]: API

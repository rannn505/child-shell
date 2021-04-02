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
import { AccumulateStream } from 'accumulate-stream';

(async (): void => {
  // file.txt: (2kb)
  // streams are awesome.
  // streams are awesome.
  // ... ...
  const readable = createReadStream('file.txt');
  const as = new AccumulateStream({ size: '1kb', phrase: 'awesome' });
  readable.pipe(accumulateStream);

  // will be emitted every 1kb and 2 writes
  as.on('chunk', ({ buffer }) => console.log(`emitted every chunk write - ${buffer.toString()}`));
  as.on('size', ({ buffer }) => console.log(`emitted every 1kb of chunks - ${buffer.toString()}`));
  as.on('phrase', ({ buffer }) =>
    console.log(`emitted whenever "stream" phrase is detected in chunk - ${buffer.toString()}`),
  );
  as.on('data', ({ buffer }) => console.log(`emitted whenever one of the conditions is met - ${buffer.toString()}`));

  await once(as, 'data');
  console.log(as.getBuffer().toString()); // streams are awesome.
})();
```

## API

// [TBD]

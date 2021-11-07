import { promisify } from 'util';
import { finished as finishedCallback, PassThrough } from 'stream';
import ms from 'ms';
import { AccumulateStream } from '../lib/AccumulateStream';

const finished = promisify(finishedCallback);

describe('AccumulateStream', () => {
  const DATA = 'data';

  test('isEmpty method', () => {
    const as = new AccumulateStream();
    expect(as.isEmpty()).toBe(true);
    as.write(DATA);
    expect(as.isEmpty()).toBe(false);
  });

  test('getBuffer method', () => {
    const as = new AccumulateStream();
    as.write(DATA);
    expect(as.getBuffer()).toBeInstanceOf(Buffer);
    expect(Buffer.compare(Buffer.from(DATA), as.getBuffer())).toBe(0);
  });

  test('emitFlush option', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream({ emitFlush: true });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.end(DATA);
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(1);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}${DATA}`));
  });

  test('chunk event', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream();
    const chunkEventHandler = jest.fn();
    as.on('chunk', chunkEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.end();
    await finished(pass);

    expect(chunkEventHandler).toHaveBeenCalledTimes(2);
    expect(chunkEventHandler).toHaveBeenNthCalledWith(1, {
      buffer: Buffer.from(DATA),
      chunk: Buffer.from(DATA),
    });
    expect(chunkEventHandler).toHaveBeenNthCalledWith(2, {
      buffer: Buffer.from(`${DATA}${DATA}`),
      chunk: Buffer.from(DATA),
    });
  });

  test('count option', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream({ count: 2 });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);
    const countEventHandler = jest.fn();
    as.on('count', countEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.end();
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(2);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}`));
    expect(countEventHandler).toHaveBeenCalledTimes(2);
    expect(countEventHandler).toHaveBeenCalledWith({ buffer: Buffer.from(`${DATA}${DATA}`) });
  });

  test('size option', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream({ size: '8b' });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);
    const sizeEventHandler = jest.fn();
    as.on('size', sizeEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.end();
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(2);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}`));
    expect(sizeEventHandler).toHaveBeenCalledTimes(2);
    expect(sizeEventHandler).toHaveBeenCalledWith({
      buffer: Buffer.from(`${DATA}${DATA}`),
      size: 8,
    });
  });

  test('interval option', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream({ interval: '1s' });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);
    const intervalEventHandler = jest.fn();
    as.on('interval', intervalEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    setTimeout(() => {
      pass.write(DATA);
      pass.write(DATA);
    }, ms('1s'));
    setTimeout(() => {
      pass.end();
    }, ms('3s'));
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(2);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}`));
    expect(intervalEventHandler).toHaveBeenCalledTimes(2);
    expect(intervalEventHandler).toHaveBeenCalledWith({ buffer: Buffer.from(`${DATA}${DATA}`) });
  });

  test('phrase option', async () => {
    const pass = new PassThrough();
    const as = new AccumulateStream({ phrase: `${DATA}${DATA}` });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);
    const phraseEventHandler = jest.fn();
    as.on('phrase', phraseEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.end();
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(2);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}`));
    expect(phraseEventHandler).toHaveBeenCalledTimes(2);
    expect(phraseEventHandler).toHaveBeenCalledWith({ buffer: Buffer.from(`${DATA}${DATA}`) });
  });

  test('custom option', async () => {
    const EVENT_NAME = 'even-chunk';
    let i = 0;
    const pass = new PassThrough();
    const as = new AccumulateStream({
      custom: {
        event: EVENT_NAME,
        isDone: (): boolean => {
          i += 1;
          return i % 2 === 0;
        },
      },
    });
    const dataEventHandler = jest.fn();
    as.on('data', dataEventHandler);
    const accumulatorEventHandler = jest.fn();
    as.on(EVENT_NAME, accumulatorEventHandler);

    pass.pipe(as);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.write(DATA);
    pass.end();
    await finished(pass);

    expect(dataEventHandler).toHaveBeenCalledTimes(2);
    expect(dataEventHandler).toHaveBeenCalledWith(Buffer.from(`${DATA}${DATA}`));
    expect(accumulatorEventHandler).toHaveBeenCalledTimes(2);
    expect(accumulatorEventHandler).toHaveBeenCalledWith({ buffer: Buffer.from(`${DATA}${DATA}`) });
  });
});

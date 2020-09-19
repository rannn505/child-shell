import { AccumulateStream, CHUNK_EVENT } from '../lib/AccumulateStream';

describe('AccumulateStream', () => {
  const DATA = 'data';

  test('isEmpty method', () => {
    const stream = new AccumulateStream();

    expect(stream.isEmpty()).toBe(true);
    stream.write(DATA);
    expect(stream.isEmpty()).toBe(false);
  });

  test('getContent method', () => {
    const stream = new AccumulateStream();

    stream.write(DATA);
    // expect(stream.getContent()).toBeTy(Buffer);
    expect(Buffer.compare(Buffer.from(DATA), stream.getContent())).toBe(0);
  });

  test('CHUNK_EVENT', () => {
    // Arrange:
    const handler = jest.fn();
    const stream = new AccumulateStream();

    // Act:
    stream.on(CHUNK_EVENT, handler);
    stream.write(DATA);
    stream.write(DATA);

    // Assert:
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, {
      chunk: Buffer.from(DATA),
      count: 1,
      chunks: Buffer.from(DATA),
    });
    expect(handler).toHaveBeenNthCalledWith(2, {
      chunk: Buffer.from(DATA),
      count: 2,
      chunks: Buffer.from(`${DATA}${DATA}`),
    });
  });
});

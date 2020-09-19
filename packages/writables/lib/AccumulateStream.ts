import { Writable } from 'stream';

export const CHUNK_EVENT = 'chunk';

export class AccumulateStream extends Writable {
  protected chunks: Buffer;
  protected chunkCounter: number;

  constructor() {
    super();

    this.chunks = Buffer.from([]);
    this.chunkCounter = 0;
  }

  _write(chunk: Buffer, encoding: BufferEncoding, cb: Function): void {
    const newChunksLength = this.chunks.length + chunk.length;
    this.chunks = Buffer.concat([this.chunks, chunk], newChunksLength);
    this.chunkCounter += 1;
    this.emit(CHUNK_EVENT, {
      chunk,
      count: this.chunkCounter,
      chunks: this.chunks,
    });
    return cb();
  }

  isEmpty(): boolean {
    return this.chunks.length === 0;
  }

  getContent(): Buffer {
    return this.chunks;
  }
}

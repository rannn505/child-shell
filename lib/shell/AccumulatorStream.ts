import { Writable } from 'stream';
import { trimBuffer } from '../common/utils';

export const CHUNK_EVENT = 'chunk';

export class AccumulatorStream extends Writable {
  protected chunks: Buffer;
  public chunkCounter: number;
  private isTrimmed: boolean;

  constructor() {
    super();

    this.chunks = Buffer.from([]);
    this.chunkCounter = 0;
    this.isTrimmed = false;
  }

  _write(chunk: Buffer, encoding: BufferEncoding, cb: Function): void {
    const newChunksLength = this.chunks.length + chunk.length;
    this.chunks = Buffer.concat([this.chunks, chunk], newChunksLength);
    this.chunkCounter += 1;
    this.emit(CHUNK_EVENT, this.chunkCounter, this.chunks);
    return cb();
  }

  isEmpty(): boolean {
    return this.chunks.length === 0;
  }

  getContent(): Buffer {
    if (!this.isTrimmed) {
      this.chunks = trimBuffer(this.chunks);
      this.isTrimmed = true;
    }
    return this.chunks;
  }
}

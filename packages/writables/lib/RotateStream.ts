import ms from 'ms';
import bytes from 'bytes';
import { AccumulateStream } from './AccumulateStream';

export const ROTATE_EVENT = 'rotate';

type RotateStreamOptions = { size?: string; interval?: string; count?: number };

export class RotateStream extends AccumulateStream {
  private readonly options: RotateStreamOptions;
  private readonly interval: NodeJS.Timeout;

  constructor(options: RotateStreamOptions = {}) {
    super();

    this.options = options;

    if (this.options.interval) {
      this.interval = setInterval(() => {
        this.rotate();
      }, ms(this.options.interval));
    }
  }

  private rotate(): void {
    this.emit(ROTATE_EVENT, this.chunkCounter, this.chunks);
    this.chunks = Buffer.from([]);
    this.chunkCounter = 0;
  }

  _write(chunk: Buffer, encoding: BufferEncoding, cb: Function): void {
    super._write(chunk, encoding, () => {});

    const isSizeDone = this.options.size && bytes(this.options.size) <= this.chunks.byteLength;
    const isCountDone = this.options.count && this.options.count <= this.chunkCounter;
    const isDone = isSizeDone || isCountDone;

    if (isDone) {
      this.rotate();
    }

    return cb();
  }

  _final(cb: Function): void {
    clearInterval(this.interval);
    return cb();
  }
}

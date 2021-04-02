import { Transform, TransformCallback } from 'stream';
import ms from 'ms';
import bytes from 'bytes';

export type AccumulateStreamOptions = {
  count?: number;
  size?: string;
  interval?: string;
  phrase?: string;
  custom?: {
    event: string;
    isDone: (this: AccumulateStream, chunk: Buffer, encoding: BufferEncoding) => boolean;
  };
  emitFlush?: boolean;
};

export type AccumulateStreamEvents = 'chunk' | 'count' | 'size' | 'interval' | 'phrase' | string;

export class AccumulateStream extends Transform {
  protected buffer: Buffer;
  protected chunksCounter: number;

  private readonly interval?: NodeJS.Timeout;

  public readonly options: AccumulateStreamOptions;

  constructor(options: AccumulateStreamOptions = {}) {
    super({
      decodeStrings: true,
      objectMode: false,
      autoDestroy: true,
      emitClose: true,
      allowHalfOpen: false,
    });
    this.options = options;
    this.reset();

    if (this.options?.interval) {
      this.interval = setInterval(() => {
        this.emitEvent('interval');
        this.drain();
      }, ms(this.options.interval));
    }
  }

  private reset(): void {
    this.buffer = Buffer.from([]);
    this.chunksCounter = 0;
  }

  private accumulate(chunk: Buffer): void {
    const newBufferLength = this.buffer.length + chunk.length;
    this.buffer = Buffer.concat([this.buffer, chunk], newBufferLength);
    this.chunksCounter += 1;
  }

  private drain(): void {
    this.push(this.getBuffer());
    this.reset();
  }

  private emitEvent(event: AccumulateStreamEvents, data = {}): void {
    this.emit(event, {
      buffer: this.getBuffer(),
      ...data,
    });
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, cb: TransformCallback): void {
    this.accumulate(chunk);
    this.emitEvent('chunk', { chunk });

    const isCountDone = this.options?.count && this.options.count <= this.chunksCounter;
    if (isCountDone) {
      this.emitEvent('count');
    }

    const isSizeDone = this.options?.size && bytes(this.options.size) <= this.buffer.byteLength;
    if (isSizeDone) {
      this.emitEvent('size', { size: this.buffer.byteLength });
    }

    const isPhraseDone = this.options?.phrase && this.buffer.includes(this.options.phrase);
    if (isPhraseDone) {
      this.emitEvent('phrase');
    }

    const isCustomDone =
      this.options?.custom &&
      this.options.custom?.event &&
      this.options.custom?.isDone &&
      this.options.custom.isDone.call(this, chunk, encoding);
    if (isCustomDone) {
      this.emitEvent(this.options.custom.event);
    }

    const isDone = isSizeDone || isCountDone || isPhraseDone || isCustomDone;
    if (isDone) {
      this.drain();
    }

    return cb();
  }

  _flush(cb: TransformCallback): void {
    if (this.options?.emitFlush && !this.isEmpty()) {
      this.drain();
    }

    return cb();
  }

  _final(cb: TransformCallback): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    return cb();
  }

  public isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  public getBuffer(): Buffer {
    return this.buffer;
  }
}

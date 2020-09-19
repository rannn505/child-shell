import { generate } from 'shortid';
import { AccumulateStream } from './AccumulateStream';

export const DOMAIN_EVENT = 'domain';

export class DomainStream extends AccumulateStream {
  readonly delimiter: string;
  private firstDelimiterOccurrence: number;
  private secondDelimiterOccurrence: number;

  constructor(delimiter = generate()) {
    super();

    this.delimiter = delimiter;
    this.firstDelimiterOccurrence = -1;
    this.secondDelimiterOccurrence = -1;
  }

  _write(chunk: Buffer, encoding: BufferEncoding, cb: Function): void {
    // 1: accumulate new chunk
    super._write(chunk, encoding, () => {});

    // 2: search for 2 delimiter occurrences
    if (this.firstDelimiterOccurrence === -1) {
      this.firstDelimiterOccurrence = this.chunks.indexOf(this.delimiter);
    }
    const secondDelimiterByteOffset =
      chunk.length + this.delimiter.length < this.chunks.length
        ? chunk.length + this.delimiter.length
        : this.delimiter.length + 1;
    this.secondDelimiterOccurrence = this.chunks.indexOf(this.delimiter, -secondDelimiterByteOffset);

    // 3: found 2 different delimiters
    const isDone =
      this.firstDelimiterOccurrence !== this.secondDelimiterOccurrence && this.secondDelimiterOccurrence !== -1;
    if (isDone) {
      // 4: fix chunks content
      this.chunks = this.chunks.slice(
        this.firstDelimiterOccurrence + this.delimiter.length,
        this.secondDelimiterOccurrence,
      );

      // 5: emit domain
      this.emit(DOMAIN_EVENT, {
        count: this.chunkCounter,
        chunks: this.chunks,
      });
    }

    // 6: call _write cb
    return cb();
  }
}

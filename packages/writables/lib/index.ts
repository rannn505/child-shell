export * from './AccumulateStream';
export * from './DomainStream';
export * from './RotateStream';

export const safeWrite = (writable: NodeJS.WritableStream, data: string | Uint8Array): Promise<void> =>
  new Promise((resolve) => {
    if (!writable.write(data)) {
      writable.once('drain', resolve);
    } else {
      process.nextTick(resolve);
    }
  });

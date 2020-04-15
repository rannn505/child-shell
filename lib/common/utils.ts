import { platform, EOL } from 'os';

export const capitalizeFirstLetter = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1);
export const isWin = platform() === 'win32';

export const safeWritableWrite = (stdin: NodeJS.WritableStream, data: string | Uint8Array): Promise<void> =>
  new Promise((resolve) => {
    if (!stdin.write(data)) {
      stdin.once('drain', resolve);
    } else {
      process.nextTick(resolve);
    }
  });

export enum Types {
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Object = 'Object',
  Array = 'Array',
  Date = 'Date',
  Regexp = 'Regexp',
  Undefined = 'Undefined',
  Null = 'Null',
}

export const toType = (obj: unknown): Types => ({}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1]);

export const trimBuffer = (buf: Buffer): Buffer => {
  const eol = EOL.charCodeAt(0);

  let start = 0;
  let end = buf.length;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= buf.length; i++) {
    if (buf[i] !== eol) {
      start = i;
      break;
    }
  }

  // eslint-disable-next-line no-plusplus
  for (let i = buf.length - 1; i >= 0; i--) {
    if (buf[i] !== eol) {
      end = i;
      break;
    }
  }

  return buf.slice(start, end + 1);
};

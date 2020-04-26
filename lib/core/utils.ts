import { platform } from 'os';

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
  Error = 'Error',
}

export const toType = (object: unknown): Types => ({}.toString.call(object).match(/\s([a-zA-Z]+)/)[1]);

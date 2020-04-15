import { SpawnOptions } from 'child_process';

export interface IProcessOptions {
  [key: string]: unknown;
}

export interface IShellProcessOptions {
  executable?: string;
  processOptions?: IProcessOptions;
  spawnOptions?: SpawnOptions;
  inputEncoding?: BufferEncoding;
  outputEncoding?: BufferEncoding;
  killSignal?: NodeJS.Signals;
  killTimeout?: string;
  killInvocationTimeout?: string;
}

export type options = IShellProcessOptions;

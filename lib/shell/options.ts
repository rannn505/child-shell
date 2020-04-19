import { SpawnOptions } from 'child_process';

export interface IShellProcessOptions {
  [key: string]: unknown;
}

export interface IShellOptions {
  executable: string;
  processOptions: IShellProcessOptions;
  spawnOptions: SpawnOptions;
  inputEncoding: BufferEncoding;
  outputEncoding: BufferEncoding;
  killSignal: NodeJS.Signals;
  killTimeout: string;
  killInvocationTimeout: string;
}

export type ShellOptions = Partial<IShellOptions>;

export type options = ShellOptions;

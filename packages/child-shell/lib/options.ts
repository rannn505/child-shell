import { SpawnOptions } from 'child_process';

export type ShellOptions = {
  [key: string]: unknown;
};

export type ShellSpawnOptions = Omit<
  SpawnOptions,
  'argv0' | 'stdio' | 'detached' | 'serialization' | 'shell' | 'timeout'
>;

export type Options = {
  // [NOTE] executable must support reading from stdin (-c -) and can be either:
  // 1) a globally installed executable like "bash", "pwsh", etc..
  // 2) a path to a shell executable
  executable?: string;

  shellOptions?: ShellOptions;
  spawnOptions?: ShellSpawnOptions;

  inputEncoding?: BufferEncoding;
  outputEncoding?: BufferEncoding;

  killSignal?: NodeJS.Signals;
  killTimeout?: string;
  invocationTimeout?: string;

  debug?: boolean;
  verbose?: boolean;
};

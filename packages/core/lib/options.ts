import { SpawnOptions, ChildProcess } from 'child_process';
import { ShellCommandResult, ShellExitData } from './types';

export type ProcessOptions = {
  [key: string]: unknown;
};

export type BeforeSpawnHookParams = { executable: string; processOptions: string[]; spawnOptions: SpawnOptions };
export type AfterSpawnHookParams = { process: ChildProcess };
export type OnActiveHookParams = { pending: number };
export type OnIdleHookParams = {};
export type BeforeInvokeHookParams = { command: string }; // TBD: cancelToken;
export type AfterInvokeHookParams = { result: ShellCommandResult };
export type AfterExitHookParams = { exitData: ShellExitData };

export type ShellHooks = Partial<{
  beforeSpawn: (params: BeforeSpawnHookParams) => void;
  afterSpawn: (params: AfterSpawnHookParams) => void;
  onActive: (params: OnActiveHookParams) => void;
  onIdle: (params: OnIdleHookParams) => void;
  beforeInvoke: (params: BeforeInvokeHookParams) => void;
  afterInvoke: (params: AfterInvokeHookParams) => void;
  afterExit: (params: AfterExitHookParams) => void;
}>;

export type ShellOptions = Partial<{
  executable: string;
  processOptions: ProcessOptions;
  spawnOptions: SpawnOptions;
  inputEncoding: BufferEncoding;
  outputEncoding: BufferEncoding;
  killSignal: NodeJS.Signals;
  killTimeout: string;
  killInvocationTimeout: string;
  hooks: ShellHooks;
  debug: boolean;
  verbose: boolean;
}>;

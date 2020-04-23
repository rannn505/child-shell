import { SpawnOptions, ChildProcess } from 'child_process';
import { ShellCommandResult, ChildProcessExitData } from '../common/types';

export type ShellProcessOptions = {
  [key: string]: unknown;
};

export type BeforeSpawnHook = ({
  executable,
  processOptions,
  spawnOptions,
}: {
  executable: string;
  processOptions: string[];
  spawnOptions: SpawnOptions;
}) => void;
export type AfterSpawnHook = ({ process }: { process: ChildProcess }) => void;
export type BeforeInvokeHook = ({ command }: { command: string }) => void; // cancelToken: () => void
export type AfterInvokeHook = ({ result }: { result: ShellCommandResult }) => void;
export type OnActiveHook = ({ pending }: { pending: number }) => void;
// eslint-disable-next-line no-empty-pattern
export type OnIdleHook = ({}: {}) => void;
export type AfterExitHook = ({ exitData }: { exitData: ChildProcessExitData }) => void;

export type ShellProcessHooks = {
  beforeSpawn?: BeforeSpawnHook;
  afterSpawn?: AfterSpawnHook;
  beforeInvoke?: BeforeInvokeHook;
  afterInvoke?: AfterInvokeHook;
  onActive?: OnActiveHook;
  onIdle?: OnIdleHook;
  afterExit?: AfterExitHook;
};

export type ShellOptions = {
  executable?: string;
  processOptions?: ShellProcessOptions;
  spawnOptions?: SpawnOptions;
  inputEncoding?: BufferEncoding;
  outputEncoding?: BufferEncoding;
  killSignal?: NodeJS.Signals;
  killTimeout?: string;
  killInvocationTimeout?: string;
  hooks?: ShellProcessHooks;
};

export type StdioObject = {
  stdin: NodeJS.WritableStream;
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
};

export type ShellCommandResult = {
  command: string;
  hadErrors: boolean;
  stdout: Buffer;
  stderr: Buffer;
  duration?: number;
  result?: string;
};

export type ChildProcessExitData = {
  code?: number;
  signal?: NodeJS.Signals;
  message: string;
  hadError: boolean;
};

export interface ILogger {
  debug: Function;
  info: Function;
  success: Function;
  warn: Function;
  error: Function;
}

export interface IStdioObject {
  stdin: NodeJS.WritableStream;
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
}

export interface IShellCommandResult {
  command: string;
  hadErrors: boolean;
  stdout: Buffer;
  stderr: Buffer;
  result?: string;
}

export interface IChildProcessExitData {
  code: number;
  signal: NodeJS.Signals;
}

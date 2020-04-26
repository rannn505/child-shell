export type ShellStdioObject = {
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

export type ShellExitData = {
  code?: number;
  signal?: NodeJS.Signals;
  message: string;
  hadError: boolean;
};

import { ChildProcess } from 'child_process';

export class BaseError extends Error {
  constructor(message = '') {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProcessError extends BaseError {
  public readonly originalError?: Error;
  public readonly exitCode?: number;
  public readonly signalCode?: NodeJS.Signals;
  public readonly message: string;

  constructor(process: ChildProcess, originalError?: Error) {
    const { pid, exitCode, signalCode } = process;
    const message = `Shell process${pid ? ` ${pid}` : ''} exited.\n${originalError?.message}`;
    super(message);
    this.originalError = originalError;
    this.exitCode = exitCode;
    this.signalCode = signalCode;
  }
}

export class InvocationError extends BaseError {}

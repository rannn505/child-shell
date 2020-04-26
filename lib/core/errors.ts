import { ShellExitData } from './types';

export class BaseError extends Error {
  constructor(message = '') {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProcessError extends BaseError {
  exitData: ShellExitData;
  constructor(exitData: ShellExitData) {
    super(exitData.message);
    this.exitData = exitData;
  }
}

export class InvocationError extends BaseError {}

export class BaseError extends Error {
  constructor(message = '') {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProcessError extends BaseError {}

export class InvocationError extends BaseError {}

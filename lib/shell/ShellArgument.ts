export interface IShellArgumentConstructor {
  new (object: unknown): ShellArgument;
}

export abstract class ShellArgument {
  readonly object: unknown;

  constructor(object: unknown) {
    this.object = object;
  }

  toString(): string {
    return this.object.toString();
  }
}

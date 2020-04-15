import { IShellArgumentConstructor } from './ShellArgument';
import { IShellParameterConstructor } from './ShellParameter';

export interface IShellCommandConstructor<T> {
  new (command?: string): T;
}

export abstract class ShellCommand<T> {
  readonly command: string;
  protected pipeline: string;
  protected statement: string;
  protected ShellCommandConstructor: IShellCommandConstructor<T>;
  protected ShellArgumentConstructor: IShellArgumentConstructor;
  protected ShellParameterConstructor: IShellParameterConstructor;
  constructor(command = '') {
    this.command = command;
    this.setPipelineChar();
    this.setStatementChar();
    this.setShellCommandConstructor();
    this.setShellArgumentConstructor();
    this.setShellParameterConstructor();
  }

  protected abstract setPipelineChar(): void;
  protected abstract setStatementChar(): void;
  protected abstract setShellCommandConstructor(): void;
  protected abstract setShellArgumentConstructor(): void;
  protected abstract setShellParameterConstructor(): void;

  addCommand(command: string | T): T {
    const newCommandString = command instanceof ShellCommand ? command.command : (command as string);
    let newCommand = '';
    if (this.command && !this.command.endsWith(this.statement)) {
      newCommand = `${this.command} ${this.pipeline} ${newCommandString}`;
    } else if (this.command) {
      newCommand = `${this.command} ${newCommandString}`;
    } else {
      newCommand = newCommandString;
    }
    return new this.ShellCommandConstructor(newCommand);
  }

  // addScript(path: string, useLocalScope: boolean = false): IShellCommand {
  //   const newCommand = `${path}`;
  //   return this.getNewCommand(newCommand);
  // }

  addArgument(object: unknown): T {
    const argument = new this.ShellArgumentConstructor(object);
    const newCommand = `${this.command} ${argument.toString()}`;
    return new this.ShellCommandConstructor(newCommand);
  }

  addParameter(name: string, value?: unknown): T {
    const parameter = new this.ShellParameterConstructor(name, value);
    const newCommand = `${this.command} ${parameter.toString()}`;
    return new this.ShellCommandConstructor(newCommand);
  }

  addStatement(): T {
    const newCommand = `${this.command}${this.statement}`;
    return new this.ShellCommandConstructor(newCommand);
  }

  clear(): T {
    return new this.ShellCommandConstructor();
  }

  clone(): T {
    return new this.ShellCommandConstructor(this.command);
  }
}

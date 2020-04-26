import { Argument } from './Argument';
import { Parameter, Dash } from './Parameter';

export const Operators = {
  Call: '.',
  Control: {
    RunAfter: ';',
    ToBackground: '&',
    And: '&&',
    Or: '||',
    Pipe: '|',
  },
  Redirect: {
    Replace: '>',
    Append: '>>',
  },
};

export class Command {
  public readonly line: string;
  protected readonly ArgumentCtor: typeof Argument;
  protected readonly ParameterCtor: typeof Parameter;

  constructor();
  constructor(line: string, ArgumentCtor?: typeof Argument, ParameterCtor?: typeof Parameter);
  constructor(line = '', ArgumentCtor = Argument, ParameterCtor = Parameter) {
    this.line = line;
    this.ArgumentCtor = ArgumentCtor;
    this.ParameterCtor = ParameterCtor;
  }

  private createNewCommand(newCommand?: string): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.constructor as any)(newCommand, this.ArgumentCtor, this.ParameterCtor);
  }

  addCommand(command: this | string, operator: string = Operators.Control.RunAfter): this {
    const newCommandLine = command instanceof Command ? command.line : (command as string);
    let newCommand = newCommandLine;
    if (this.line && this.line.endsWith(Operators.Control.RunAfter)) {
      newCommand = `${this.line} ${newCommandLine}`;
    } else if (this.line) {
      newCommand = `${this.line} ${operator} ${newCommandLine}`;
    }

    return this.createNewCommand(newCommand);
  }

  addScript(path: string): this {
    const newCommand = `${Operators.Call} ${path}`;
    return this.addCommand(newCommand);
  }

  addArgument(value: unknown): this {
    const argument = new this.ArgumentCtor(value);
    const newCommand = `${this.line} ${argument.toString()}`;

    return this.createNewCommand(newCommand);
  }

  addParameter(dash: Dash, name: string, value?: unknown): this {
    const parameter = new this.ParameterCtor(dash, name, value);
    const newCommand = `${this.line} ${parameter.toString()}`;

    return this.createNewCommand(newCommand);
  }

  clear(): this {
    return this.createNewCommand();
  }

  clone(): this {
    return this.createNewCommand(this.line);
  }
}

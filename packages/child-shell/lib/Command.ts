import { Serializer } from './Serializer';

export type Operator = '|' | ';' | '&' | '||' | '&&';

export type Dash = '-' | '--';

const serializer = new Serializer();

export class Command {
  public readonly line: string;

  constructor();
  constructor(line: string);
  constructor(line = '') {
    this.line = line;
  }

  private createNewCommand(newCommand?: string): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.constructor as any)(newCommand);
  }

  addCommand(command: Command | string, operator: Operator = '|'): this {
    const newCommandLine = command instanceof Command ? command.line : (command as string);
    let newCommand = newCommandLine;
    const isEndsWithOperator = ['|', ';', '&', '||', '&&'].some((op) => this.line.endsWith(op));
    if (this.line && isEndsWithOperator) {
      newCommand = `${this.line} ${newCommandLine}`;
    } else if (this.line) {
      newCommand = `${this.line} ${operator} ${newCommandLine}`;
    }

    return this.createNewCommand(newCommand);
  }

  addScript(path: string): this {
    const newCommand = `. ${path}`;
    return this.addCommand(newCommand);
  }

  addArgument(value: unknown): this {
    const argument = serializer.serialize(value);
    const newCommand = `${this.line} ${argument}`;

    return this.createNewCommand(newCommand);
  }

  addParameter(dash: Dash, name: string, value?: unknown): this {
    const parameterValue = serializer.serialize(value);
    const parameter = parameterValue ? `${dash}${name} ${parameterValue}` : `${dash}${name}`;
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

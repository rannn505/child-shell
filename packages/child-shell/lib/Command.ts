import { JavaScriptTypeConverter } from './JavaScriptTypeConverter';

export type Dash = '-' | '--';

export type Parameter = { dash: Dash; name: string; value?: unknown };

export class Command {
  protected readonly typeConverter: JavaScriptTypeConverter;
  protected readonly pipeOperator: string;
  protected readonly callOperator: string;

  public readonly line: string;

  constructor();
  constructor(line?: string, typeConverter?: JavaScriptTypeConverter, pipeOperator?: string, callOperator?: string);

  constructor(line = '', typeConverter = new JavaScriptTypeConverter(), pipeOperator = '|', callOperator = '.') {
    this.line = line;
    this.typeConverter = typeConverter;
    this.pipeOperator = pipeOperator;
    this.callOperator = callOperator;
  }

  private create(line?: string): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.constructor as any)(line, this.typeConverter, this.pipeOperator, this.callOperator);
  }

  public addCommand(command: Command | string): this {
    const addition = command instanceof Command ? command.line : (command as string);
    if (!this.line) {
      return this.create(addition);
    }
    return this.create(`${this.line} ${this.pipeOperator} ${addition}`);
  }

  public addScript(path: string): this {
    return this.addCommand(`${this.callOperator} ${path}`);
  }

  public addArgument(argument: unknown): this {
    const addition = this.typeConverter.convert(argument);
    return this.create(`${this.line} ${addition}`.trim());
  }

  public addParameter(parameter: Parameter): this {
    const { dash, name, value } = parameter;
    const parameterValue = this.typeConverter.convert(value);
    const addition = parameterValue ? `${dash}${name} ${parameterValue}` : `${dash}${name}`;
    return this.create(`${this.line} ${addition}`);
  }

  public addParameters(parameters: Parameter[] = []): this {
    parameters.forEach((parameter) => this.addParameter(parameter));
    return this;
  }

  public clear(): this {
    return this.create();
  }

  public clone(): this {
    return this.create(this.line);
  }
}

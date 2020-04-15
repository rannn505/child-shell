import { EventEmitter } from 'events';
import { Subject } from 'rxjs';
import { IStdioObject, IShellCommandResult } from '../common/types';
import { options } from './options';
import { PSInvocationState } from './enums/PSInvocationState';
import { PSProcess } from './PSProcess';
import { PSCommand } from './PSCommand';

export class NodePowerShell extends EventEmitter {
  public powershell: PSProcess;
  public command: PSCommand;
  public invocationStateInfo: PSInvocationState;
  readonly streams: IStdioObject;
  readonly results: Subject<IShellCommandResult>;
  readonly history: IShellCommandResult[];

  constructor(opts: options = {}) {
    super();

    this.powershell = new PSProcess(opts);
    this.command = new PSCommand();
    this.invocationStateInfo = this.powershell.invocationStateInfo;
    this.streams = this.powershell.streams;
    this.results = this.powershell.results;
    this.history = this.powershell.history;
  }

  addCommand(command: string | PSCommand): NodePowerShell {
    this.command = this.command.addCommand(command);
    return this;
  }

  addArgument(argument: string): NodePowerShell {
    this.command = this.command.addArgument(argument);
    return this;
  }

  addParameter(name: string, value?: unknown): NodePowerShell {
    this.command = this.command.addParameter(name, value);
    return this;
  }

  addParameters(parameters: { name: string; value?: unknown }[] = []): NodePowerShell {
    parameters.forEach((p) => this.addParameter(p.name, p.value));
    return this;
  }

  clear(): NodePowerShell {
    this.command = this.command.clear();
    return this;
  }

  async invoke(): Promise<IShellCommandResult> {
    const commandToInvoke = this.command.command;
    this.clear();
    return this.powershell.invoke(commandToInvoke);
  }

  dispose(): Promise<IShellCommandResult> {
    return this.powershell.invoke('exit 0');
  }

  kill(): void {
    this.powershell.kill();
  }
}

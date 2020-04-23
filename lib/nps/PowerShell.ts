import { Signale } from 'signale';
import { isWin } from '../common/utils';
import { ShellCommandResult } from '../common/types';
import { ShellProcess } from '../shell/ShellProcess';
import { PSExecutableType } from './enums/PSExecutableType';
import { PSInvocationState } from './enums/PSInvocationState';
import { PowerShellOptions, PowerShellProcessOptions } from './options';
import { PSCommand } from './PSCommand';
import { PSOption } from './PSOption';

export class PowerShell extends ShellProcess {
  public command: PSCommand;
  public invocationStateInfo: PSInvocationState;

  constructor(options: PowerShellOptions = {}) {
    super(options);
    this.command = new PSCommand();

    this.beforeSpawn = ({ executable }): void => {
      this.setExecutableSuffix(executable);
      this.invocationStateInfo = PSInvocationState.NotStarted;
    };
    this.afterSpawn = (): void => {
      this.command.addCommand('$PSVersionTable');
      this.invoke();
    };
    this.beforeInvoke = (): void => {
      this.invocationStateInfo = PSInvocationState.Running;
    };
    this.afterInvoke = ({ result }): void => {
      this.invocationStateInfo = result.hadErrors ? PSInvocationState.Failed : PSInvocationState.Completed;
    };
    this.onIdle = (): void => {
      this.invocationStateInfo = PSInvocationState.Stopped;
    };
    this.afterExit = (): void => {
      this.invocationStateInfo = PSInvocationState.Disconnected;
    };
  }

  protected setLogger({ verbose = false }: { verbose?: boolean }): Signale {
    return new Signale({ scope: 'NPS', disabled: !verbose, config: { displayTimestamp: true } });
  }

  protected setExecutable({
    pwsh = false,
    pwshPrev = false,
    executable,
  }: {
    pwsh?: boolean;
    pwshPrev?: boolean;
    executable?: PSExecutableType;
  }): string {
    // eslint-disable-next-line no-shadow
    const { PowerShell, PowerShellCore, PowerShellCorePreview } = PSExecutableType;

    if (process.env.NPS) {
      return process.env.NPS as PSExecutableType;
    }

    if (pwsh) {
      return PowerShellCore;
    }

    if (pwshPrev) {
      return PowerShellCorePreview;
    }

    if (!executable) {
      return !isWin ? PowerShellCore : PowerShell;
    }

    switch (executable) {
      case PowerShell:
        return PowerShellCore;
      case PowerShellCore:
        return PowerShellCore;
      case PowerShellCorePreview:
        return PowerShellCore;
      default:
        throw new Error('Unable to determine PS executable');
    }
  }

  private setExecutableSuffix(executable: string): void {
    if (!isWin) {
      return;
    }
    // eslint-disable-next-line no-param-reassign
    executable = `${executable}.exe`;
  }

  protected setProcessOptions({
    processOptions = {
      noLogo: true,
      noExit: true,
      command: '-', // need to be last
    },
  }: {
    processOptions?: PowerShellProcessOptions;
  }): string[] {
    let powershellOptions: string[] = [];
    Object.keys(processOptions).forEach((opt: string) => {
      const psOption = new PSOption(opt, processOptions[opt]);
      powershellOptions = [...powershellOptions, ...psOption.toArray()];
    });
    return powershellOptions;
  }

  protected writeToOut(input: string): string {
    return `[Console]::Out.WriteLine("${input}")`;
  }

  protected writeToErr(input: string): string {
    return `[Console]::Error.WriteLine("${input}")`;
  }

  addCommand(command: string | PSCommand): PowerShell {
    this.command = this.command.addCommand(command);
    return this;
  }

  addArgument(argument: string): PowerShell {
    this.command = this.command.addArgument(argument);
    return this;
  }

  addParameter(name: string, value?: unknown): PowerShell {
    this.command = this.command.addParameter(name, value);
    return this;
  }

  addParameters(parameters: { name: string; value?: unknown }[] = []): PowerShell {
    parameters.forEach((p) => this.addParameter(p.name, p.value));
    return this;
  }

  clear(): PowerShell {
    this.command = this.command.clear();
    return this;
  }

  async invoke(): Promise<ShellCommandResult> {
    const commandToInvoke = this.command.command;
    this.clear();
    return super.invoke(commandToInvoke);
  }

  dispose(): Promise<ShellCommandResult> {
    return super.invoke('exit 0');
  }
}

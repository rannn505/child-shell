import { isWin } from '../common/utils';
import { IShellCommandResult } from '../common/types';
import { ShellProcess } from '../shell/ShellProcess';
import { PSExecutableType } from './enums/PSExecutableType';
import { PSInvocationState } from './enums/PSInvocationState';
import { PowerShellOptions, PowerShellProcessOptions } from './options';
import { PSCommand } from './PSCommand';
import { PSOption } from './PSOption';

// const DEFAULT_PROCESS_ERROR_MSG = `
//   Node-PowerShell was unable to start PowerShell.
//   Please make sure that PowerShell is installed properly on your system, and try again.
//   https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell
// `;

export class PowerShell extends ShellProcess {
  public command: PSCommand;
  public invocationStateInfo: PSInvocationState;

  constructor(options: PowerShellOptions = {}) {
    super(options);

    this.command = new PSCommand();
  }

  protected setExecutable({
    pwsh = false,
    pwshPrev = false,
    executable,
  }: {
    pwsh?: boolean;
    pwshPrev?: boolean;
    executable?: PSExecutableType;
  }): void {
    // eslint-disable-next-line no-shadow
    const { PowerShell, PowerShellCore, PowerShellCorePreview } = PSExecutableType;

    if (process.env.NPS) {
      this.executable = process.env.NPS as PSExecutableType;
      return;
    }

    if (pwsh) {
      this.executable = PowerShellCore;
      return;
    }

    if (pwshPrev) {
      this.executable = PowerShellCorePreview;
      return;
    }

    if (!executable) {
      this.executable = !isWin ? PowerShellCore : PowerShell;
      return;
    }

    switch (executable) {
      case PowerShell:
        this.executable = PowerShellCore;
        return;
      case PowerShellCore:
        this.executable = PowerShellCore;
        return;
      case PowerShellCorePreview:
        this.executable = PowerShellCore;
        return;
      default:
        throw new Error('Unable to determine PS executable');
    }
  }

  private setExecutableSuffix(): void {
    if (!isWin) {
      return;
    }
    this.executable = `${this.executable}.exe`;
  }

  protected setProcessOptions({
    processOptions = {
      noLogo: true,
      noExit: true,
      command: '-', // need to be last
    },
  }: {
    processOptions?: PowerShellProcessOptions;
  }): void {
    let powershellOptions: string[] = [];
    Object.keys(processOptions).forEach((opt: string) => {
      const psOption = new PSOption(opt, processOptions[opt]);
      powershellOptions = [...powershellOptions, ...psOption.toArray()];
    });
    this.processOptions = powershellOptions;
  }

  protected writeToOut(input: string): string {
    return `[Console]::Out.WriteLine("${input}")`;
  }

  protected writeToErr(input: string): string {
    return `[Console]::Error.WriteLine("${input}")`;
  }

  protected beforeSpawn(): void {
    this.setExecutableSuffix();
    this.invocationStateInfo = PSInvocationState.NotStarted;
  }

  protected afterSpawn(): void {
    // super.invoke('$PSVersionTable');
  }

  protected beforeInvoke(): void {
    this.invocationStateInfo = PSInvocationState.Running;
  }

  protected afterInvoke(): void {
    this.invocationStateInfo = this.history[0].hadErrors ? PSInvocationState.Failed : PSInvocationState.Completed;
  }

  protected onIdle(): void {
    this.invocationStateInfo = PSInvocationState.Stopped;
  }

  protected afterExit(): void {
    this.invocationStateInfo = PSInvocationState.Disconnected;
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

  async invoke(): Promise<IShellCommandResult> {
    const commandToInvoke = this.command.command;
    this.clear();
    return super.invoke(commandToInvoke);
  }

  dispose(): Promise<IShellCommandResult> {
    return super.invoke('exit 0');
  }
}

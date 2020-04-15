import { isWin } from '../common/utils';
import { ShellProcess } from '../shell/ShellProcess';
import { PSExecutableType } from './enums/PSExecutableType';
import { PSInvocationState } from './enums/PSInvocationState';
import { PowerShellOptions } from './options';
import { PSOption } from './PSOption';

// const DEFAULT_PROCESS_ERROR_MSG = `
//   Node-PowerShell was unable to start PowerShell.
//   Please make sure that PowerShell is installed properly on your system, and try again.
//   https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell
// `;

export class PSProcess extends ShellProcess {
  public invocationStateInfo: PSInvocationState;

  protected setExecutable({
    pwsh = false,
    pwshPrev = false,
    executable,
  }: {
    pwsh?: boolean;
    pwshPrev?: boolean;
    executable?: PSExecutableType;
  }): void {
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
        throw new Error('unable to determine PS executable');
    }
  }

  protected setProcessOptions({
    processOptions = {
      noLogo: true,
      noExit: true,
      command: '-', // need to be last
    },
  }: {
    processOptions?: PowerShellOptions;
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

  private setExecutableSuffix(): void {
    if (!isWin) {
      return;
    }
    this.executable = `${this.executable}.exe`;
  }

  beforeSpawn(): void {
    this.setExecutableSuffix();
    this.invocationStateInfo = PSInvocationState.NotStarted;
  }

  beforeInvoke(): void {
    this.invocationStateInfo = PSInvocationState.Running;
  }

  afterInvoke(hadErrors: boolean): void {
    this.invocationStateInfo = !hadErrors ? PSInvocationState.Completed : PSInvocationState.Failed;
  }

  onIdle(): void {
    this.invocationStateInfo = PSInvocationState.Stopped;
  }

  afterExit(): void {
    this.invocationStateInfo = PSInvocationState.Disconnected;
  }
}

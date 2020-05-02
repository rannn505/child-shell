import { isWin, ShellCommandResult, Shell, ShellHooks } from '@nsh/core';
import { PSExecutableType } from './enums/PSExecutableType';
import { PSInvocationState } from './enums/PSInvocationState';
import { PSOption } from './PSOption';
import { PSCommand } from './PSCommand';
import { PowerShellOptions, PowerShellProcessOptions } from './options';

export class PowerShell extends Shell {
  public invocationStateInfo: PSInvocationState;

  constructor(options: PowerShellOptions = {}) {
    super(options, 'NPS', PSCommand);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  protected setHooks(): ShellHooks {
    return {
      beforeSpawn: ({ executable }): void => {
        this.setExecutableSuffix(executable);
        this.invocationStateInfo = PSInvocationState.NotStarted;
      },
      afterSpawn: (): void => {
        this.addCommand('$PSVersionTable');
        this.invoke();
      },
      onIdle: (): void => {
        this.invocationStateInfo = PSInvocationState.Stopped;
      },
      beforeInvoke: (): void => {
        this.invocationStateInfo = PSInvocationState.Running;
      },
      afterInvoke: ({ result }): void => {
        this.invocationStateInfo = result.hadErrors ? PSInvocationState.Failed : PSInvocationState.Completed;
      },
      afterExit: (): void => {
        this.invocationStateInfo = PSInvocationState.Disconnected;
      },
    };
  }

  protected writeToOut(input: string): string {
    return `[Console]::Out.WriteLine("${input}")`;
  }

  protected writeToErr(input: string): string {
    return `[Console]::Error.WriteLine("${input}")`;
  }

  public dispose(): Promise<ShellCommandResult> {
    this.addCommand('exit 0');
    return super.invoke();
  }
}

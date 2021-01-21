import { platform } from 'os';
import isWsl from 'is-wsl';
import { ShellOptions, ShellCommandResult, Shell } from 'child-shell';
import { PSCommand } from './PSCommand';

const isWin = platform() === 'win32' || isWsl;

export enum PSExecutableType {
  PowerShell = 'powershell',
  PowerShellCore = 'pwsh',
  PowerShellCorePreview = 'pwsh-preview',
}

export type PowerShellOptions = ShellOptions & {
  pwsh?: boolean;
  pwshPrev?: boolean;
  executable?: PSExecutableType;
};

export class PowerShell extends Shell {
  constructor(options: PowerShellOptions = {}) {
    const addDefaultOption = options;
    addDefaultOption.executableOptions = [
      { dash: '-', name: 'noLogo' },
      { dash: '-', name: 'noExit' },
      { dash: '-', name: 'command', value: '-' },
    ];

    super(options, PSCommand);
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
        throw new Error('Unable to determine PowerShell executable');
    }
  }

  protected writeToOutput(input: string): string {
    return `[Console]::Out.WriteLine("${input}")`;
  }

  protected writeToError(input: string): string {
    return `[Console]::Error.WriteLine("${input}")`;
  }

  // private setExecutableSuffix(executable: string): void {
  //   if (!isWin) {
  //     return;
  //   }
  //   // eslint-disable-next-line no-param-reassign
  //   executable = `${executable}.exe`;
  // }

  // public dispose(): Promise<ShellCommandResult> {
  //   this.addCommand('exit 0');
  //   return super.invoke();
  // }
}

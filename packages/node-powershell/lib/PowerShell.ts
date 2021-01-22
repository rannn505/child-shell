import { platform } from 'os';
import isWsl from 'is-wsl';
import { ExecutableOptions, ShellOptions, Shell } from 'child-shell';
import { PSCommand } from './PSCommand';

export enum PSExecutableType {
  PowerShell = 'powershell',
  PowerShellCore = 'pwsh',
  PowerShellCorePreview = 'pwsh-preview',
}

// https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe
export type PSExecutableOptions = ExecutableOptions &
  Partial<{
    '-PSConsoleFile': string;
    '-Version': '2.0' | '3.0';
    '-NoLogo': boolean;
    '-NoExit': boolean;
    '-Sta': boolean;
    '-Mta': boolean;
    '-NoProfile': boolean;
    '-NonInteractive': boolean;
    '-InputFormat': 'Text' | 'XML';
    '-OutputFormat': 'Text' | 'XML';
    '-WindowStyle': string;
    '-ConfigurationName': string;
    // https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies
    '-ExecutionPolicy':
      | 'AllSigned'
      | 'Bypass'
      | 'Default'
      | 'RemoteSigned'
      | 'Restricted'
      | 'Undefined'
      | 'Unrestricted'
      | string;
  }>;

export type PowerShellOptions = ShellOptions & {
  pwsh?: boolean;
  pwshPrev?: boolean;
  executable?: PSExecutableType;
  executableOptions?: PSExecutableOptions;
};

const isWin = platform() === 'win32' || isWsl;

export class PowerShell extends Shell {
  constructor(psOptions: PowerShellOptions = {}) {
    const options = psOptions;
    options.executableOptions = {
      '-NoLogo': true,
      ...psOptions.executableOptions,
      '-NoExit': true,
      '-Command': '-',
    };
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

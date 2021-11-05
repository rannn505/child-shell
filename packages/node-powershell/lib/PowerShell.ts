import { platform } from 'os';
import isWsl from 'is-wsl';
import { ExecutableOptions, ShellOptions, Shell, Converter, Converters } from 'child-shell';

export enum PSExecutableType {
  PowerShellWin = 'powershell',
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

const nullConverter: Converter = () => '$Null';
const booleanConverter: Converter = (object) => ((object as boolean) ? '$True' : '$False');
const objectConverter: Converter = (object) => `@${JSON.stringify(object).replace(/:/g, '=').replace(/,/g, ';')}`;
const dateConverter: Converter = (object) => (object as Date).toLocaleString();

const PS_CONVERTERS: Converters = new Map([
  ['null', nullConverter],
  ['boolean', booleanConverter],
  ['object', objectConverter],
  ['date', dateConverter],
]);

export class PowerShell extends Shell {
  converters = PS_CONVERTERS;

  constructor(options: PowerShellOptions = {}) {
    super({
      ...options,
      executableOptions: {
        '-NoLogo': true,
        ...options.executableOptions,
        '-NoExit': true,
        '-Command': '-',
      },
    });
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
    const { PowerShellWin, PowerShellCore, PowerShellCorePreview } = PSExecutableType;

    if (process.env.NPS) {
      return process.env.NODE_POWERSHELL as PSExecutableType;
    }

    if (pwsh) {
      return PowerShellCore;
    }

    if (pwshPrev) {
      return PowerShellCorePreview;
    }

    if (!executable) {
      return !isWin ? PowerShellCore : PowerShellWin;
    }

    switch (executable) {
      case PowerShellWin:
        return PowerShellWin;
      case PowerShellCore:
        return PowerShellCore;
      case PowerShellCorePreview:
        return PowerShellCore;
      default:
        return super.setExecutable({ executable });
    }
  }

  protected writeToOutput(input: string): string {
    return `[Console]::Out.WriteLine("${input}")`;
  }

  protected writeToError(input: string): string {
    return `[Console]::Error.WriteLine("${input}")`;
  }
}

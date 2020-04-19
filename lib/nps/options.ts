import { IShellProcessOptions, ShellOptions } from '../shell/options';
import { PSExecutableType } from './enums/PSExecutableType';

interface IPowerShellProcessOptions {
  sta: boolean;
  mta: boolean;
  command: string;
  configurationName: string;
  customPipeName: string;
  encodedCommand: string;
  executionPolicy: string;
  file: string;
  help: boolean;
  inputFormat: string;
  // login: string,
  noExit: boolean;
  noLogo: boolean;
  nonInteractive: boolean;
  noProfile: boolean;
  outputFormat: string;
  removeWorkingDirectoryTrailingCharacter: boolean;
  settingsFile: string;
  version: boolean;
  windowStyle: string;
  workingDirectory: string;
}
export type PowerShellProcessOptions = IShellProcessOptions & Partial<IPowerShellProcessOptions>;

interface IPowerShellOptions {
  port: string;
  verbose: boolean;
  pwsh: boolean;
  pwshPrev: boolean;
  executable: PSExecutableType;
  processOptions: PowerShellProcessOptions;
}
export type PowerShellOptions = ShellOptions & Partial<IPowerShellOptions>;

export type options = PowerShellOptions;

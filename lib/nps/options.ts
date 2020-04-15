import { IProcessOptions, IShellProcessOptions } from '../shell/options';
import { PSExecutableType } from './enums/PSExecutableType';

interface IPowerShellOptions {
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
export type PowerShellOptions = IProcessOptions & Partial<IPowerShellOptions>;

interface IPowerShellProcessOptions {
  pwsh: boolean;
  pwshPrev: boolean;
  executable: PSExecutableType;
  processOptions: PowerShellOptions;
}
export type PowerShellProcessOptions = IShellProcessOptions & Partial<IPowerShellProcessOptions>;

interface INodePowerShellOptions {
  port: string;
  verbose: boolean;
}
export type NodePowerShellOptions = Partial<INodePowerShellOptions>;

export type options = NodePowerShellOptions & PowerShellProcessOptions;

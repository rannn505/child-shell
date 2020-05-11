import { ProcessOptions, ShellOptions } from '@nbsh/core';
import { PSExecutableType } from './enums/PSExecutableType';

export type PowerShellProcessOptions = ProcessOptions &
  Partial<{
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
  }>;

export type PowerShellOptions = ShellOptions &
  Partial<{
    port: string;
    pwsh: boolean;
    pwshPrev: boolean;
    executable: PSExecutableType;
    processOptions: PowerShellProcessOptions;
  }>;

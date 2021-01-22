import { ExecutableOptions, ShellOptions, Shell } from 'child-shell';
import { SHCommand } from './SHCommand';

// https://man7.org/linux/man-pages/man1/bash.1.html
export type BashExecutableOptions = ExecutableOptions &
  Partial<{
    '--dump-po-strings': boolean;
    '--dump-strings': boolean;
    '--noediting': boolean;
    '--noprofile': boolean;
    '--norc': boolean;
    '--posix': boolean;
    '--pretty-print': boolean;
    '--rcfile': boolean;
    '--restricted': boolean;
    '--verbose': boolean;
  }>;

export type BashOptions = Omit<
  ShellOptions & {
    executableOptions?: BashExecutableOptions;
  },
  'executable'
>;

export class Bash extends Shell {
  constructor(bashOptions: BashOptions = {}) {
    const options = bashOptions;
    options.executableOptions = {
      ...bashOptions.executableOptions,
      '-i': false,
      '-s': true,
    };
    super(options, SHCommand);
  }

  protected setExecutable(): string {
    if (process.env.NSH) {
      return process.env.NSH;
    }
    return 'bash';
  }

  protected writeToOutput(input: string): string {
    return `echo "${input}"`;
  }

  protected writeToError(input: string): string {
    return `>&2 echo "${input}"`;
  }
}

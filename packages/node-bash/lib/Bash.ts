import { ExecutableOptions, ShellOptions, Shell } from 'child-shell';

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

export type BashOptions = ShellOptions & {
  executableOptions?: BashExecutableOptions;
};

export class Bash extends Shell {
  constructor(options: BashOptions = {}) {
    super({
      executable: 'bash',
      ...options,
      executableOptions: {
        ...options.executableOptions,
        '-i': false,
        '-s': true,
      },
    });
  }

  protected writeToOutput(input: string): string {
    return `echo "${input}"`;
  }

  protected writeToError(input: string): string {
    return `>&2 echo "${input}"`;
  }
}

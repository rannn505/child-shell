import { ExecutableOptions, InvocationResult, ShellOptions, Shell } from 'child-shell';

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

  public static convert(object: unknown): string {
    return Shell.convert(object, new Map([]));
  }

  public static async invoke(command: string, options?: BashOptions): Promise<InvocationResult> {
    return Shell.invoke(command, options, Bash);
  }

  public static async $(literals: readonly string[], ...args: unknown[]): Promise<InvocationResult> {
    return Bash.invoke(Bash.command(literals, args));
  }
}

export const { $ } = Bash;
export const sh$ = $;

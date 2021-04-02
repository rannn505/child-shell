import { EOL } from 'os';
import { inspect } from 'util';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { Readable, Writable } from 'stream';
import { once } from 'events';
import kindOf from 'kind-of';
import Debugger from 'debug';
import pTimeout from 'p-timeout';
import PQueue from 'p-queue';
import { nanoid } from 'nanoid';
import { AccumulateStream } from 'accumulate-stream';
import { trimBuffer } from 'trim-buffer';
import { JavaScriptTypes, Converters, SHELL_CONVERTERS } from './Converters';
import { ProcessError, InvocationError } from './errors';

export type StdioObject = {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
};

export type Debuggers = {
  comment: Debugger.Debugger;
  command: Debugger.Debugger;
  output: Debugger.Debugger;
};

export type ExecutableOptions = {
  [key: string]: boolean | string;
};

export type ShellSpawnOptions = Omit<
  SpawnOptions,
  'argv0' | 'stdio' | 'detached' | 'serialization' | 'shell' | 'timeout'
>;

export type InvocationResult = {
  command: string;
  raw: string;
  hadErrors: boolean;
  startTime: number;
  duration?: number;
  stdout?: Buffer;
  stderr?: Buffer;
};

export type ShellOptions = {
  // executable must support reading from stdin (-c -) and can be either:
  // 1) a globally installed executable like "bash", "pwsh", etc.. that appears on $PATH
  // 2) a local path to a shell executable
  executable?: string;
  executableOptions?: ExecutableOptions;
  spawnOptions?: ShellSpawnOptions;
  inputEncoding?: BufferEncoding;
  outputEncoding?: BufferEncoding;
  debug?: boolean;
  disposeTimeout?: number;
  invocationTimeout?: number;
  throwOnInvocationError?: boolean;
};

export type ShellCtor = new (options: ShellOptions) => Shell;

export abstract class Shell {
  private readonly executable: string;
  private readonly executableOptions: string[];
  private readonly spawnOptions: SpawnOptions;
  private readonly invocationQueue: PQueue;
  private static readonly enabledDebuggers: string[] = [];
  private readonly debuggers: Debuggers;
  private readonly process: ChildProcess;
  private isExited = false;
  private readonly exitPromise: Promise<void>;
  private readonly resultsEncoding: BufferEncoding;
  private readonly invocationTimeout: number;
  private readonly throwOnInvocationError: boolean;

  protected abstract writeToOutput(input: string): string;
  protected abstract writeToError(input: string): string;

  public readonly streams: StdioObject;
  public readonly history: InvocationResult[] = [];

  constructor(options: ShellOptions = {}) {
    this.executable = this.setExecutable(options);
    this.executableOptions = this.setExecutableOptions(options);
    this.spawnOptions = { ...options.spawnOptions, stdio: 'pipe', detached: false, shell: false };
    this.invocationQueue = this.setInvocationQueue();

    this.process = spawn(this.executable, this.executableOptions, this.spawnOptions);

    this.debuggers = this.setDebuggers(options);
    this.debuggers.comment(`shell process started: "${this.executable} ${this.executableOptions.join(' ')}"`);
    this.exitPromise = this.setProcessExitListeners();
    this.resultsEncoding = options.outputEncoding ?? 'utf-8';
    this.setProcessStdioEncoding(options);
    this.setProcessKillOptions(options);
    this.invocationTimeout = options.invocationTimeout;
    this.throwOnInvocationError = options.throwOnInvocationError ?? true;
    this.streams = {
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      stderr: this.process.stderr,
    };
  }

  private detachStreamFromOutput(stream: Writable): void {
    this.process.stdout.unpipe(stream);
    this.process.stderr.unpipe(stream);
    stream.end();
  }

  private async readBulkFromOutput(stream: Readable, delimiter: string): Promise<Buffer> {
    let firstDelimiterOccurrence = -1;
    let secondDelimiterOccurrence = -1;

    const accumulator = new AccumulateStream({
      custom: {
        event: delimiter,
        isDone(chunk): boolean {
          const buffer = this.getBuffer();
          // search for 2 delimiter occurrences
          if (firstDelimiterOccurrence === -1) {
            firstDelimiterOccurrence = buffer.indexOf(delimiter);
          }
          const secondDelimiterByteOffset =
            chunk.length + delimiter.length < buffer.length ? chunk.length + delimiter.length : delimiter.length + 1;
          secondDelimiterOccurrence = buffer.indexOf(delimiter, -secondDelimiterByteOffset);
          // found 2 different delimiters
          return firstDelimiterOccurrence !== secondDelimiterOccurrence && secondDelimiterOccurrence !== -1;
        },
      },
    });

    accumulator.on('chunk', ({ chunk }: { chunk: Buffer }): void =>
      this.debuggers.output(trimBuffer(chunk).toString(this.resultsEncoding)),
    );

    stream.pipe(accumulator);
    const [accumulatedOutput] = await once(accumulator, 'data');
    this.detachStreamFromOutput(accumulator);

    // slice and trim output buffer
    return trimBuffer(accumulatedOutput.slice(firstDelimiterOccurrence + delimiter.length, secondDelimiterOccurrence));
  }

  protected setExecutable({ executable }: { executable?: string }): string {
    if (!executable) {
      throw new Error(`unable to determine shell executable
${inspect(
  { platform: process.platform, SHELL: process.env.SHELL, PATH: process.env.PATH, ...process.versions },
  { compact: true, depth: 5, breakLength: 80 },
)}`);
    }
    return executable;
  }

  private setExecutableOptions({ executableOptions = {} }: { executableOptions?: ExecutableOptions }): string[] {
    let options: string[] = [];
    Object.entries(executableOptions).forEach(([name, value]) => {
      if (!name.startsWith('-') && name.startsWith('--')) {
        throw new Error(`option ${name} must starts with a dash "-" | "--"`);
      }
      switch (typeof value) {
        case 'string':
          options = [...options, name, value as string];
          break;
        case 'boolean':
          options = (!value as boolean) ? [...options] : [...options, name];
          break;
        default:
          throw new Error(`option ${name} value must be string or boolean`);
      }
    });
    return options;
  }

  private setInvocationQueue(): PQueue {
    return new PQueue({
      concurrency: 1,
      autoStart: true,
    });
  }

  private clearInvocationQueue(): void {
    this.invocationQueue.pause();
    this.invocationQueue.removeAllListeners();
    this.invocationQueue.clear();
  }

  private setDebuggers({ debug }: { debug?: boolean }): Debuggers {
    const namespace = `${this.executable.split('/')?.pop()?.toUpperCase()}:${this.process.pid}`;
    const _debugger = Debugger(namespace);
    // eslint-disable-next-line no-console
    _debugger.log = console.log.bind(console);

    if (debug) {
      Shell.enabledDebuggers.push(`${namespace}*`);
      Debugger.enable(Shell.enabledDebuggers.join(','));
    }

    return {
      comment: _debugger.extend(' #'),
      command: _debugger.extend(' $'),
      output: _debugger.extend(' >'),
    };
  }

  private setProcessExitListeners(): Promise<void> {
    let useStderrOnExit = false;

    // listen to stderr for catching starter errors
    const stderr = new AccumulateStream({ count: 3 });
    this.process.stderr.pipe(stderr);
    once(stderr, 'data').then(() => {
      // probably there is no starter error after 3 chunks so disable this listener
      this.detachStreamFromOutput(stderr);
    });

    // set up process exit listeners
    const processErrorPromise = once(this.process, 'error').then(([error]: [Error]) => {
      throw new ProcessError(this.process, error);
    });
    const processExitPromise = once(this.process, 'exit').then(([code, signal]: [number, NodeJS.Signals]) => {
      const error = !useStderrOnExit ? undefined : new Error(stderr.getBuffer().toString(this.resultsEncoding));

      if (signal && signal !== 'SIGTERM') {
        throw new ProcessError(this.process, error);
      }
      // code 143 === SIGTERM
      if (code && code !== 0 && code !== 143) {
        throw new ProcessError(this.process, error);
      }
    });
    if (this.process.stdin) {
      // catch EPIPE error to avoid node crash and let process's 'exit' event to determine result
      once(this.process.stdin, 'error').then(() => {
        useStderrOnExit = true;
      });
    }

    // ordered process exit scenarios:
    // ENOENT - spawn error - `error` listener
    // EPIPE - bad process option - `exit` listener
    // EXIT<code/signal> - process exit with either 0 or error - `exit` listener
    return Promise.race([processErrorPromise, processExitPromise]).finally(() => {
      this.isExited = true;
      this.clearInvocationQueue();
      this.process.stdin.end();
      this.detachStreamFromOutput(stderr);
      this.debuggers.comment(`shell process exited`);
    });
  }

  private setProcessStdioEncoding({
    inputEncoding = 'utf-8',
    outputEncoding = 'utf-8',
  }: {
    inputEncoding?: BufferEncoding;
    outputEncoding?: BufferEncoding;
  }): void {
    this.process.stdin.setDefaultEncoding(inputEncoding);
    this.process.stdout.setEncoding(outputEncoding);
    this.process.stderr.setEncoding(outputEncoding);
  }

  private setProcessKillOptions({ disposeTimeout }: { disposeTimeout?: number }): void {
    if (disposeTimeout) {
      setTimeout(async () => {
        await this.dispose();
      }, disposeTimeout);
    }
  }

  private async invokeCommand(command: string): Promise<InvocationResult> {
    this.debuggers.comment('starting command invocation');
    this.debuggers.command(command);

    // update history with current command
    this.history.unshift({
      command,
      raw: '',
      hadErrors: false,
      startTime: Date.now(),
    });
    const currentHistoryRecord = this.history[0];

    // generate output bulk delimiter
    const bulkDelimiter = nanoid();

    // init bulk readers for both output streams
    const outputPromise = Promise.all([
      this.readBulkFromOutput(this.process.stdout, bulkDelimiter),
      this.readBulkFromOutput(this.process.stderr, bulkDelimiter),
    ]);

    // race output and error
    let isCommandFailed = false;
    let isCommandTimedOut = false;
    const isCommandDone = Promise.race([this.exitPromise, outputPromise]);

    // write delimiter then command then delimiter to process input so `readBulkFromOutput` will detect the exact command output
    this.process.stdin.write(this.writeToError(bulkDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOutput(bulkDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(command);
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToError(bulkDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOutput(bulkDelimiter));
    this.process.stdin.write(EOL);

    try {
      // wait for command to finish and apply timeout if needed
      // [EXIT] process crushed -> throw ProcessError
      if (!this.invocationTimeout) {
        await isCommandDone;
      } else {
        await pTimeout(isCommandDone, this.invocationTimeout, () => {
          isCommandTimedOut = true;
        });
      }
    } finally {
      // calculate results and update history
      currentHistoryRecord.duration = Date.now() - currentHistoryRecord.startTime;
      if (!this.isExited) {
        if (!isCommandTimedOut) {
          const [stdout, stderr] = await outputPromise;
          currentHistoryRecord.stdout = stdout;
          currentHistoryRecord.stderr = stderr;
          isCommandFailed = stderr.length !== 0;
          if (!isCommandFailed) {
            // [EXIT] invocation succeeded -> return result
            currentHistoryRecord.raw = currentHistoryRecord.stdout.toString(this.resultsEncoding);
            this.debuggers.comment('command invocation succeeded');
          } else {
            // [EXIT] invocation failed -> return failed result
            currentHistoryRecord.hadErrors = true;
            currentHistoryRecord.raw = currentHistoryRecord.stderr.toString(this.resultsEncoding);
            this.debuggers.comment('command invocation failed');
          }
        } else {
          // [EXIT] invocationTimeout reached -> return partial failed result
          currentHistoryRecord.hadErrors = true;
          this.debuggers.comment('command invocation timed out');
        }
      } else {
        // [EXIT] user killed process gracefully -> return partial result
        this.debuggers.comment('command invocation stopped');
      }
    }

    // return or throw command result
    if (this.throwOnInvocationError && currentHistoryRecord.hadErrors) {
      throw new InvocationError(currentHistoryRecord.raw);
    }
    return currentHistoryRecord;
  }

  protected static convert(object: unknown, converters: Converters = new Map([])): string {
    const _converters = new Map([...SHELL_CONVERTERS, ...converters]);
    const objectType = kindOf(object) as JavaScriptTypes;
    const hasConverter = new Map([...SHELL_CONVERTERS, ..._converters]).has(objectType);
    if (!hasConverter) {
      throw new Error(`there is no converter to a ${objectType} object`);
    }
    return _converters.get(objectType).call(undefined, object, Shell.convert);
  }

  public static command(literals: readonly string[], ...args: unknown[]): string {
    return literals
      .map((literal, index) => {
        return `${literal}${Shell.convert(args?.[index])}`;
      })
      .join('');
  }

  protected static async invoke(command: string, options: ShellOptions, Ctor: ShellCtor): Promise<InvocationResult> {
    const shell = new Ctor(options);
    try {
      return await shell.invoke(command);
    } finally {
      await shell.dispose();
    }
  }

  public async invoke(command: string): Promise<InvocationResult> {
    if (this.isExited) {
      throw new InvocationError('invoke called after process exited');
    }
    return this.invocationQueue.add(() => this.invokeCommand(command));
  }

  public async dispose(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    if (!this.isExited) {
      this.clearInvocationQueue();
      this.process.kill(signal);
    }
    return this.exitPromise;
  }
}

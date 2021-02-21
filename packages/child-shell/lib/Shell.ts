import { EOL } from 'os';
import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { Readable, Writable } from 'stream';
import { once } from 'events';

import Debugger from 'debug';
import PQueue from 'p-queue';
import ms from 'ms';
import { generate } from 'shortid';
import { AccumulateStream } from 'accumulate-stream';
import { trimBuffer } from 'trim-buffer';

import { ProcessError, InvocationError } from './errors';
import { Command, Parameter } from './Command';

export type ExecutableOptions = {
  [key: string]: boolean | string;
};

export type ShellSpawnOptions = Omit<
  SpawnOptions,
  'argv0' | 'stdio' | 'detached' | 'serialization' | 'shell' | 'timeout'
>;

export type ShellOptions = {
  // executable must support reading from stdin (-c -) and can be either:
  // 1) a globally installed executable like "bash", "pwsh", etc.. that appears on $PATH
  // 2) a local path to a shell executable
  executable?: string;
  executableOptions?: ExecutableOptions;
  spawnOptions?: ShellSpawnOptions;

  inputEncoding?: BufferEncoding;
  outputEncoding?: BufferEncoding;

  killSignal?: NodeJS.Signals;
  killTimeout?: string;
  invocationTimeout?: string;
  throwOnInvocationError?: boolean;

  debug?: boolean;
  verbose?: boolean;
};

export type ShellStdioObject = {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
};

export type ShellDebuggers = {
  comment: Debugger.Debugger;
  command: Debugger.Debugger;
  output: Debugger.Debugger;
};

export type ShellCommandResult = {
  command: string;

  hadErrors: boolean;
  stdout?: Buffer;
  stderr?: Buffer;
  result?: string;

  startTime: number;
  duration?: number;
};
type bla = 'bla';

export abstract class Shell {
  private readonly executable: string;
  private readonly executableOptions: string[];
  private readonly spawnOptions: SpawnOptions;
  private readonly invocationQueue: PQueue;
  private readonly debuggers: ShellDebuggers;
  private readonly process: ChildProcess;
  private isExited: boolean;
  private readonly exitPromise: Promise<void>;
  private readonly resultsEncoding: BufferEncoding;
  private readonly killSignal: NodeJS.Signals;
  private readonly throwOnInvocationError: boolean;

  public readonly streams: ShellStdioObject;
  public readonly history: ShellCommandResult[];

  public command: Command;

  protected abstract setExecutable({ executable }: { executable?: string }): string;
  protected abstract writeToOutput(input: string): string;
  protected abstract writeToError(input: string): string;

  constructor(options: ShellOptions, CommandCtor = Command) {
    this.executable = this.setExecutable(options);
    this.executableOptions = this.setExecutableOptions(options);
    this.spawnOptions = { ...options.spawnOptions, stdio: 'pipe', detached: false, shell: false };
    this.invocationQueue = this.setInvocationQueue(options);

    this.debuggers = this.setDebuggers(options);
    this.debuggers.comment(`starting shell with command "${this.executable} ${this.executableOptions.join(' ')}"`);

    this.process = spawn(this.executable, this.executableOptions, this.spawnOptions);

    this.isExited = false;
    this.exitPromise = this.setProcessExitListeners();

    this.resultsEncoding = options.outputEncoding ?? 'utf-8';
    this.setProcessStdioEncoding(options);

    this.killSignal = options.killSignal ?? 'SIGTERM';
    this.setProcessKillOptions(options);
    this.throwOnInvocationError = options.throwOnInvocationError ?? true;

    this.streams = {
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      stderr: this.process.stderr,
    };
    this.history = [];

    this.command = new CommandCtor();
  }

  private detachStream(stream: Writable): void {
    this.process.stdout.unpipe(stream);
    this.process.stderr.unpipe(stream);
    stream.end();
  }

  private async bulkReadStream(stream: Readable, delimiter: string): Promise<Buffer> {
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
    this.detachStream(accumulator);

    // slice and trim output buffer
    return trimBuffer(accumulatedOutput.slice(firstDelimiterOccurrence + delimiter.length, secondDelimiterOccurrence));
  }

  private setExecutableOptions({ executableOptions = {} }: { executableOptions?: ExecutableOptions }): string[] {
    let options: string[] = [];
    Object.entries(executableOptions).forEach(([name, value]) => {
      if (!name.startsWith('-') && name.startsWith('--')) {
        throw new TypeError(`option ${name} must starts with a dash "-" | "--"`);
      }
      switch (typeof value) {
        case 'string':
          options = [...options, name, value as string];
          break;
        case 'boolean':
          options = (!value as boolean) ? options : [...options, name];
          break;
        default:
          throw new TypeError(`option ${name} value must be string or boolean`);
      }
    });
    return options;
  }

  private setInvocationQueue({ invocationTimeout }: { invocationTimeout?: string }): PQueue {
    const timeout = invocationTimeout ? ms(invocationTimeout) : undefined;
    const invocationQueue = new PQueue({
      concurrency: 1,
      timeout,
      throwOnTimeout: false,
      autoStart: true,
    });
    return invocationQueue;
  }

  private clearInvocationQueue(): void {
    this.invocationQueue.pause();
    this.invocationQueue.removeAllListeners();
    this.invocationQueue.clear();
  }

  private setDebuggers({ debug, verbose }: { debug?: boolean; verbose?: boolean }): ShellDebuggers {
    const namespace = this.executable.toUpperCase();
    const _debugger = Debugger(namespace);
    // eslint-disable-next-line no-console
    _debugger.log = console.log.bind(console);

    if (debug || verbose) {
      Debugger.enable(`${namespace}*`);
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
      this.detachStream(stderr);
    });

    // set up process exit listeners
    const processErrorPromise = once(this.process, 'error').then(([error]: [Error]) => {
      throw new ProcessError(this.process, error);
    });
    const processExitPromise = once(this.process, 'exit').then(([code, signal]: [number, NodeJS.Signals]) => {
      const error = !useStderrOnExit ? undefined : new Error(stderr.getBuffer().toString(this.resultsEncoding));

      if (signal && signal !== this.killSignal) {
        throw new ProcessError(this.process, error);
      }
      if (code && code !== 0) {
        throw new ProcessError(this.process, error);
      }
    });
    if (this.process.stdin) {
      // catch EPIPE error to avoid node crash and let process's 'exit' event to determine result
      once(this.process.stdin, 'error').then(() => {
        useStderrOnExit = true;
      });
    }

    // Process exit scenarios:
    // 1) ENOENT - spawn error - error$
    // 2) EPIPE - bad process option - exit$
    // 3) EXIT<code/signal> - process exit with either 0 or error - exit$
    return Promise.race([processErrorPromise, processExitPromise]).finally(() => {
      this.isExited = true;
      this.clearInvocationQueue();
      this.process.stdin.end();
      this.detachStream(stderr);
      this.debuggers.comment(`shell exited with code ${this.process.exitCode}`);
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

  private setProcessKillOptions({ killTimeout }: { killTimeout?: string }): void {
    const timeout = killTimeout ? ms(killTimeout) : undefined;
    if (timeout) {
      setTimeout(() => {
        this.kill();
      }, timeout);
    }
  }

  private async invokeCommand(command: string): Promise<ShellCommandResult> {
    this.debuggers.comment('starting command invocation');
    this.debuggers.command(command);

    // 1: update history with current command
    this.history.unshift({
      command,
      hadErrors: false,
      startTime: Date.now(),
    });
    const currentHistoryRecord = this.history[0];

    // 2: init output stream readers and bulk delimiters
    const stdoutDelimiter = generate();
    const stdoutPromise = this.bulkReadStream(this.process.stdout, stdoutDelimiter);
    const stderrDelimiter = generate();
    const stderrPromise = this.bulkReadStream(this.process.stderr, stderrDelimiter);

    // 3: race output and error
    const isOutputDone = Promise.all([stdoutPromise, stderrPromise]);
    const isCommandDone = Promise.race([this.exitPromise, isOutputDone]);

    // 4: write delimiter then command then delimiter to process input so bulkReadStream will detect the exact command output
    this.process.stdin.write(this.writeToError(stderrDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOutput(stdoutDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(command);
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToError(stderrDelimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOutput(stdoutDelimiter));
    this.process.stdin.write(EOL);

    try {
      // 5: wait for command to finish
      await isCommandDone; // [EXIT] process crushed -> throw ProcessError
    } finally {
      // 6: calculate results and update history
      currentHistoryRecord.duration = Date.now() - currentHistoryRecord.startTime;
      if (!this.isExited) {
        currentHistoryRecord.stdout = await stdoutPromise;
        currentHistoryRecord.stderr = await stderrPromise;
        if (currentHistoryRecord.stderr.length === 0) {
          // [EXIT] invocation succeeded -> return result
          currentHistoryRecord.result = currentHistoryRecord.stdout.toString(this.resultsEncoding);
          this.debuggers.comment('command invocation succeeded');
        } else {
          // [EXIT] invocation failed -> throwOnInvocationError ? throws InvocationError : return failed result
          currentHistoryRecord.hadErrors = true;
          currentHistoryRecord.result = currentHistoryRecord.stderr.toString(this.resultsEncoding);
          this.debuggers.comment('command invocation failed');
        }
      } else {
        // [EXIT] user killed process gracefully -> return partial result
        this.debuggers.comment('command invocation stopped');
        currentHistoryRecord.result = 'process exited before command invocation finished';
      }
    }

    // 7: return command result
    if (this.throwOnInvocationError && currentHistoryRecord.hadErrors) {
      throw new InvocationError(currentHistoryRecord.result);
    }
    return currentHistoryRecord;
  }

  public addCommand(command: Command | string): this {
    this.command = this.command.addCommand(command);
    return this;
  }

  public addScript(path: string): this {
    this.command = this.command.addScript(path);
    return this;
  }

  public addArgument(argument: unknown): this {
    this.command = this.command.addArgument(argument);
    return this;
  }

  public addParameter(parameter: Parameter): this {
    this.command = this.command.addParameter(parameter);
    return this;
  }

  public addParameters(parameters: Parameter[] = []): this {
    this.command = this.command.addParameters(parameters);
    return this;
  }

  public clear(): this {
    this.command = this.command.clear();
    return this;
  }

  public async invoke(): Promise<ShellCommandResult> {
    if (this.isExited) {
      throw new InvocationError('invoke called after process exited');
    }
    return this.invocationQueue.add(() => {
      const commandToInvoke = this.command.line;
      this.clear();
      return this.invokeCommand(commandToInvoke);
    });
  }

  public async kill(): Promise<void> {
    if (!this.isExited) {
      this.process.kill(this.killSignal);
    }
    return this.exitPromise;
  }

  public async invokeAndKill(): Promise<ShellCommandResult> {
    const result = await this.invoke();
    await this.kill();
    return result;
  }
}

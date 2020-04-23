import { EOL } from 'os';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { Writable } from 'stream';
import { once } from 'events';
import PQueue from 'p-queue';
import ms from 'ms';
import { Subject, fromEvent, race, Observable } from 'rxjs';
import { map, first, mapTo, delay, tap } from 'rxjs/operators';
import { ProcessError, InvocationError } from '../common/errors';
import { StdioObject, ShellCommandResult, ChildProcessExitData, ILogger } from '../common/types';
import { CHUNK_EVENT } from './streams/AccumulateStream';
import { DomainStream, DOMAIN_EVENT } from './streams/DomainStream';
import { RotateStream, ROTATE_EVENT } from './streams/RotateStream';
import {
  ShellOptions,
  ShellProcessOptions,
  ShellProcessHooks,
  BeforeInvokeHook,
  BeforeSpawnHook,
  AfterSpawnHook,
  AfterInvokeHook,
  OnActiveHook,
  OnIdleHook,
  AfterExitHook,
} from './options';

export abstract class ShellProcess {
  private readonly logger: ILogger;
  private readonly hooks: ShellProcessHooks;
  private readonly executable: string;
  private readonly processOptions: string[];
  private readonly spawnOptions: SpawnOptions;
  private readonly invocationQueue: PQueue;
  private isExited: boolean;
  private readonly killSignal: NodeJS.Signals;
  private readonly process: ChildProcess;
  private readonly exitObserver: Subject<ChildProcessExitData>;
  private readonly resultsEncoding: BufferEncoding;
  readonly streams: StdioObject;
  readonly results: Subject<ShellCommandResult>;
  readonly history: ShellCommandResult[];

  protected beforeSpawn: BeforeSpawnHook = (): void => {};
  protected afterSpawn: AfterSpawnHook = (): void => {};
  protected beforeInvoke: BeforeInvokeHook = (): void => {};
  protected afterInvoke: AfterInvokeHook = (): void => {};
  protected onActive: OnActiveHook = (): void => {};
  protected onIdle: OnIdleHook = (): void => {};
  protected afterExit: AfterExitHook = (): void => {};

  constructor(options: ShellOptions) {
    this.logger = this.setLogger(options);
    this.hooks = options.hooks ?? {};
    this.executable = this.setExecutable(options);
    this.processOptions = this.setProcessOptions(options);
    this.spawnOptions = options.spawnOptions;
    this.invocationQueue = this.setInvocationQueue(options);
    this.isExited = false;

    this.logger.info(`Starting ${this.executable} ${this.processOptions.join(' ')}`);
    this.beforeSpawn({
      executable: this.executable,
      processOptions: this.processOptions,
      spawnOptions: this.spawnOptions,
    });
    this.hooks?.beforeSpawn?.({
      executable: this.executable,
      processOptions: this.processOptions,
      spawnOptions: this.spawnOptions,
    });

    this.process = spawn(this.executable, this.processOptions, this.spawnOptions);

    this.resultsEncoding = options.outputEncoding ?? 'utf-8';
    this.killSignal = options.killSignal ?? 'SIGTERM';
    this.exitObserver = this.setProcessExitListeners();
    this.setProcessStdioEncoding(options);
    this.setProcessKillOptions(options);

    this.streams = {
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      stderr: this.process.stderr,
    };
    this.results = new Subject<ShellCommandResult>();
    this.history = [];

    this.afterSpawn({ process: this.process });
    this.hooks?.afterSpawn?.({ process: this.process });
  }

  // eslint-disable-next-line no-empty-pattern
  protected abstract setLogger({}: {}): ILogger;
  protected abstract setExecutable({ executable }: { executable?: string }): string;
  protected abstract setProcessOptions({ processOptions }: { processOptions?: ShellProcessOptions }): string[];
  protected abstract writeToOut(input: string): string;
  protected abstract writeToErr(input: string): string;

  private setInvocationQueue({ killInvocationTimeout }: { killInvocationTimeout?: string }): PQueue {
    const timeout = killInvocationTimeout ? ms(killInvocationTimeout) : undefined;
    const invocationQueue = new PQueue({
      concurrency: 1,
      timeout,
      throwOnTimeout: false,
      autoStart: true,
    });

    invocationQueue.on('active', () => {
      this.onActive({ pending: invocationQueue.pending });
      this.hooks?.onActive?.({ pending: invocationQueue.pending });
    });
    invocationQueue.onIdle().then(() => {
      this.onIdle({});
      this.hooks?.onIdle?.({});
    });

    return invocationQueue;
  }

  private clearInvocationQueue(): void {
    this.invocationQueue.pause();
    this.invocationQueue.removeAllListeners();
    this.invocationQueue.clear();
  }

  private setProcessExitListeners(): Subject<ChildProcessExitData> {
    // create process exit observer
    const subject = new Subject<ChildProcessExitData>();

    // listen to stderr for catching starter errors
    let useStderr = false;
    const stderr = new RotateStream({ count: 5 });
    this.process.stderr.pipe(stderr);
    once(stderr, ROTATE_EVENT).then(() => {
      // probably there is no starter error after 5 chunks so disable this listener
      this.detachStdio(stderr);
    });

    // utils for building exit message
    const { pid } = this.process;
    const messagePrefix = `Process${pid ? ` ${pid}` : ''} exited with`;
    const getMessageSuffix = (): string => (useStderr ? `\n${stderr.getContent().toString(this.resultsEncoding)}` : '');

    // process listeners
    const error$ = fromEvent(this.process, 'error').pipe(
      first(),
      map((err: Error) => {
        throw new ProcessError({
          message: `${messagePrefix} error ${err.message}${getMessageSuffix()}`,
          hadError: true,
        });
      }),
    );
    const exit$ = fromEvent(this.process, 'exit').pipe(
      first(),
      map(([code, signal]: [number, NodeJS.Signals]) => {
        if (signal && signal !== this.killSignal) {
          throw new ProcessError({
            message: `${messagePrefix} signal ${signal}${getMessageSuffix()}`,
            hadError: true,
            signal,
          });
        }

        if (code && code !== 0) {
          throw new ProcessError({
            message: `${messagePrefix} code ${code}${getMessageSuffix()}`,
            hadError: true,
            code,
          });
        }

        return { message: `${messagePrefix} code 0`, hadError: false, code: 0 };
      }),
    );
    let inError$: Observable<ChildProcessExitData>;
    if (this.process.stdin) {
      // catch EPIPE error to avoid node crash ->
      inError$ = fromEvent(this.process.stdin, 'error').pipe(
        // only once ->
        first(),
        // mark useStderr as true ->
        tap(() => {
          useStderr = true;
        }),
        // silence it ->
        mapTo({ message: '', hadError: true, code: -1 }),
        // delay it so exit$ will win the race ->
        delay(1000),
        // result: exit result determined by $exit
      );
    }

    // clean after process exited
    const onProcessExit = (exitData: ChildProcessExitData): void => {
      this.isExited = true;
      this.clearInvocationQueue();
      this.process.stdin.end();
      this.detachStdio(stderr);
      this.logger.info(exitData.message);
      this.afterExit({ exitData });
      this.hooks?.afterExit?.({ exitData });
    };

    subject.subscribe({
      next: (exitData: ChildProcessExitData) => onProcessExit(exitData),
      error: (error: ProcessError) => onProcessExit(error.exitData),
      complete: () => {},
    });

    // Process exit scenarios:
    // 1) ENOENT - spawn error - error$
    // 2) EPIPE - bad process option - exit$
    // 3) EXIT<code/signal> - process exit with either 0 or error - exit$
    race(error$, exit$, inError$).subscribe(subject);

    return subject;
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

  private isSignalReceived(): boolean {
    return this.process.killed;
  }

  private detachStdio(stream: Writable): void {
    this.process.stdout.unpipe(stream);
    this.process.stderr.unpipe(stream);
    stream.end();
  }

  private async invokeTask(command: string): Promise<ShellCommandResult> {
    // 1: update history
    this.history.unshift({
      command,
      hadErrors: false,
      stdout: Buffer.from([]),
      stderr: Buffer.from([]),
    });
    const currentHistoryRecord = this.history[0];

    // 2: init and pipe output streams
    const logOutput = (chunk: Buffer): void => this.logger.debug(chunk.toString(this.resultsEncoding));
    const stdout = new DomainStream();
    this.process.stdout.pipe(stdout);
    stdout.on(CHUNK_EVENT, logOutput);
    const stderr = new DomainStream();
    this.process.stderr.pipe(stderr);
    stderr.on(CHUNK_EVENT, logOutput);

    // 3: race output and error
    const results = Promise.race([
      this.exitObserver.toPromise(),
      Promise.all([once(stdout, DOMAIN_EVENT), once(stderr, DOMAIN_EVENT)]),
    ]);

    this.logger.info('Starting command invocation...');
    this.logger.debug(`  ${command}`);
    this.beforeInvoke({ command });
    this.hooks?.beforeInvoke?.({ command });
    const startTime = Date.now();

    // 4.1: write delimiter to process input
    this.process.stdin.write(this.writeToErr(stderr.delimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOut(stdout.delimiter));
    this.process.stdin.write(EOL);
    // 4.2: write command to process input
    this.process.stdin.write(command);
    this.process.stdin.write(EOL);
    // 4.3: write delimiter to process input
    this.process.stdin.write(this.writeToErr(stderr.delimiter));
    this.process.stdin.write(EOL);
    this.process.stdin.write(this.writeToOut(stdout.delimiter));
    this.process.stdin.write(EOL);

    // 5: wait for results
    await results;

    // 6: update history with results/error
    currentHistoryRecord.duration = Date.now() - startTime;
    currentHistoryRecord.stdout = stdout.getContent();
    currentHistoryRecord.stderr = stderr.getContent();
    if (stderr.isEmpty()) {
      currentHistoryRecord.result = currentHistoryRecord.stdout.toString(this.resultsEncoding);
      this.logger.success('Command invocation succeeded');
    } else {
      currentHistoryRecord.hadErrors = true;
      currentHistoryRecord.result = currentHistoryRecord.stderr.toString(this.resultsEncoding);
      this.logger.error('Command invocation failed');
    }

    // 7: clean
    this.detachStdio(stdout);
    this.detachStdio(stderr);

    // 8: return command result
    this.afterInvoke({ result: currentHistoryRecord });
    this.hooks?.afterInvoke?.({ result: currentHistoryRecord });
    this.results.next(currentHistoryRecord);
    return currentHistoryRecord;
  }

  async invoke(command: string): Promise<ShellCommandResult> {
    if (this.isExited) {
      throw new InvocationError('Invoke called after process exited');
    }
    return this.invocationQueue.add(() => this.invokeTask(command));
  }

  async kill(): Promise<ChildProcessExitData> {
    if (!this.isExited) {
      this.process.kill(this.killSignal);
    }
    return this.exitObserver.toPromise();
  }
}

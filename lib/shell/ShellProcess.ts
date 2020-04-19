import { EOL } from 'os';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { Writable } from 'stream';
import { once } from 'events';
import PQueue from 'p-queue';
import ms from 'ms';
import { Subject, fromEvent, from, race } from 'rxjs';
import { map, first, mapTo, delay, tap } from 'rxjs/operators';
import { ProcessError, InvocationError } from '../common/errors';
import { IStdioObject, IShellCommandResult } from '../common/types';
import { ShellOptions, IShellProcessOptions } from './options';
import { DomainStream, DOMAIN_EVENT } from './streams/DomainStream';
import { RotateStream, ROTATE_EVENT } from './streams/RotateStream';

export abstract class ShellProcess {
  private isExited: boolean;
  private exitObserver: Subject<string>;
  private resultsEncoding: BufferEncoding;
  private killSignal: NodeJS.Signals;

  protected executable: string;
  protected processOptions: string[];
  protected spawnOptions: SpawnOptions;
  protected invocationQueue: PQueue;
  protected readonly process: ChildProcess;
  readonly streams: IStdioObject;
  readonly results: Subject<IShellCommandResult>;
  readonly history: IShellCommandResult[];

  constructor(options: ShellOptions) {
    this.setExecutable(options);
    this.setProcessOptions(options);
    this.spawnOptions = options.spawnOptions;
    this.setInvocationQueue(options);
    this.isExited = false;

    this.beforeSpawn();
    this.process = spawn(this.executable, this.processOptions, this.spawnOptions);
    this.exitObserver = this.setProcessExitListeners();
    this.setProcessStdioEncoding(options);
    this.setProcessKillOptions(options);

    this.streams = {
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      stderr: this.process.stderr,
    };
    this.results = new Subject<IShellCommandResult>();
    this.history = [];

    this.afterSpawn();
  }

  protected abstract setExecutable({ executable }: { executable?: string }): void;
  protected abstract setProcessOptions({ processOptions }: { processOptions?: IShellProcessOptions }): void;
  protected abstract writeToOut(input: string): string;
  protected abstract writeToErr(input: string): string;
  protected beforeSpawn(): void {}
  protected afterSpawn(): void {}
  protected beforeInvoke(): void {}
  protected afterInvoke(): void {}
  protected onActive(): void {}
  protected onIdle(): void {}
  protected afterExit(): void {}

  private setInvocationQueue({ killInvocationTimeout }: { killInvocationTimeout?: string }): void {
    const timeout = killInvocationTimeout ? ms(killInvocationTimeout) : undefined;
    this.invocationQueue = new PQueue({
      concurrency: 1,
      timeout,
      throwOnTimeout: false,
      autoStart: true,
    });

    this.invocationQueue.on('active', () => this.onActive());
    this.invocationQueue.onIdle().then(() => this.onIdle());
  }

  private clearInvocationQueue(): void {
    this.invocationQueue.pause();
    this.invocationQueue.removeAllListeners();
    this.invocationQueue.clear();
  }

  private setProcessExitListeners(): Subject<string> {
    // create process exit observer
    const subject = new Subject<string>();

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
    const error$ = fromEvent(this.process, 'error')
      .pipe(first())
      .pipe(
        map((err: Error) => {
          throw new ProcessError(`${messagePrefix} error ${err.message}${getMessageSuffix()}`);
        }),
      );
    const exit$ = fromEvent(this.process, 'exit')
      .pipe(first())
      .pipe(
        map(([code, signal]: [number, string]) => {
          if (signal && signal !== this.killSignal) {
            throw new ProcessError(`${messagePrefix} signal ${signal}${getMessageSuffix()}`);
          }

          if (code && code !== 0) {
            throw new ProcessError(`${messagePrefix} code ${code}${getMessageSuffix()}`);
          }

          return `${messagePrefix} code 0`;
        }),
      );
    let inError$ = from(['']);
    if (this.process.stdin) {
      // catch EPIPE error to avoid node crash ->
      inError$ = fromEvent(this.process.stdin, 'error')
        .pipe(first())
        .pipe(
          // mark useStderr as true ->
          tap(() => {
            useStderr = true;
          }),
          // silence it ->
          mapTo(''),
          // delay it so exit$ will win the race ->
          delay(1000),
        );
      // exit result determined by $exit
    }

    // clean after process exited
    const onProcessExit = (): void => {
      this.isExited = true;
      this.clearInvocationQueue();
      this.process.stdin.end();
      this.detachStdio(stderr);
      this.afterExit();
    };

    subject.subscribe({
      error: () => onProcessExit(),
      complete: () => onProcessExit(),
    });

    // Process exit scenarios:
    // 1) ENOENT - spawn error - error$
    // 2) EPIPE - bad process option - exit$
    // 3) EXIT<code/signal> - process exit with either 0 or error - exit$
    race(error$, exit$, inError$).subscribe(subject);

    return subject;
  }

  private setProcessStdioEncoding({
    inputEncoding = 'utf8',
    outputEncoding = 'utf8',
  }: {
    inputEncoding?: BufferEncoding;
    outputEncoding?: BufferEncoding;
  }): void {
    this.process.stdin.setDefaultEncoding(inputEncoding);
    this.process.stdout.setEncoding(outputEncoding);
    this.process.stderr.setEncoding(outputEncoding);
    this.resultsEncoding = outputEncoding;
  }

  private setProcessKillOptions({
    killSignal = 'SIGTERM',
    killTimeout,
  }: {
    killSignal?: NodeJS.Signals;
    killTimeout?: string;
  }): void {
    this.killSignal = killSignal;

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

  private async invokeTask(command: string): Promise<IShellCommandResult> {
    this.beforeInvoke();

    // 1: update history
    this.history.unshift({
      command,
      hadErrors: false,
      stdout: Buffer.from([]),
      stderr: Buffer.from([]),
    });
    const currentHistoryRecord = this.history[0];

    // 2: init and pipe output streams
    const stdout = new DomainStream();
    this.process.stdout.pipe(stdout);
    const stderr = new DomainStream();
    this.process.stderr.pipe(stderr);

    // 3: race output and error
    const results = Promise.race([
      this.exitObserver.toPromise(),
      Promise.all([once(stdout, DOMAIN_EVENT), once(stderr, DOMAIN_EVENT)]),
    ]);

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

    // 5: clean
    this.detachStdio(stdout);
    this.detachStdio(stderr);

    // 6: update history with results/error
    currentHistoryRecord.stdout = stdout.getContent();
    currentHistoryRecord.stderr = stderr.getContent();

    if (stderr.isEmpty()) {
      currentHistoryRecord.result = currentHistoryRecord.stdout.toString(this.resultsEncoding);
    } else {
      currentHistoryRecord.hadErrors = true;
      currentHistoryRecord.result = currentHistoryRecord.stderr.toString(this.resultsEncoding);
    }

    this.afterInvoke();

    // 7: return command result
    this.results.next(currentHistoryRecord);
    return currentHistoryRecord;
  }

  async invoke(command: string): Promise<IShellCommandResult> {
    if (this.isExited) {
      throw new InvocationError('Invoke called after process exited');
    }
    return this.invocationQueue.add(() => this.invokeTask(command));
  }

  async kill(): Promise<string> {
    if (!this.isExited) {
      this.process.kill(this.killSignal);
    }
    return this.exitObserver.toPromise();
  }
}

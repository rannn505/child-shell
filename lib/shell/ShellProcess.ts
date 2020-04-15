import { EOL } from 'os';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { once } from 'events';
import PQueue from 'p-queue';
import ms from 'ms';
import { Subject } from 'rxjs';
import { ProcessError, InvocationError } from '../common/errors';
import { IStdioObject, IShellCommandResult } from '../common/types';
import { IShellProcessOptions, IProcessOptions } from './options';
import { DomainStream, DOMAIN_EVENT } from './DomainStream';

export abstract class ShellProcess {
  private isExited: boolean;
  private exitPromise: Promise<string>;
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

  constructor(options: IShellProcessOptions) {
    this.setExecutable(options);
    this.setProcessOptions(options);
    this.spawnOptions = options.spawnOptions;
    this.setInvocationQueue(options);
    this.isExited = false;

    this.beforeSpawn();
    this.process = spawn(this.executable, this.processOptions, this.spawnOptions);
    this.afterSpawn();

    this.exitPromise = this.setProcessExitListeners();
    this.setProcessStdioEncoding(options);
    this.setProcessKillOptions(options);

    this.streams = {
      stdin: this.process.stdin,
      stdout: this.process.stdout,
      stderr: this.process.stderr,
    };
    this.results = new Subject<IShellCommandResult>();
    this.history = [];
  }

  protected abstract setExecutable({ executable }: { executable?: string }): void;
  protected abstract setProcessOptions({ processOptions }: { processOptions?: IProcessOptions }): void;
  protected abstract writeToOut(input: string): string;
  protected abstract writeToErr(input: string): string;
  protected beforeSpawn(): void {}
  protected afterSpawn(): void {}
  protected beforeInvoke(): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected afterInvoke(hadErrors: boolean): void {}
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

  private async setProcessExitListeners(): Promise<string> {
    if (!this.process.pid) {
      throw new ProcessError('process is no longer exists');
    }

    const listeners = [once(this.process, 'error'), once(this.process, 'exit')];
    if (this.process.stdin) {
      listeners.push(once(this.process.stdin, 'error'));
    }
    const exitData = await Promise.race(listeners);

    this.isExited = true;
    this.clearInvocationQueue();
    this.process.stdin.end();

    this.afterExit();

    const messagePrefix = `process ${this.process.pid} exited with`;
    const [code, signal, err] = exitData;

    if (signal && signal !== this.killSignal) {
      throw new ProcessError(`${messagePrefix} signal ${signal}`);
    }

    if (code && code !== 0) {
      throw new ProcessError(`${messagePrefix} code ${code}`);
    }

    if (err) {
      throw new ProcessError(`${messagePrefix} error ${err}`);
    }

    return `${messagePrefix} code 0`;
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

  private async invokeTask(command: string): Promise<IShellCommandResult> {
    if (this.isExited) {
      return;
    }

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
      this.exitPromise,
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
    this.process.stdout.unpipe(stdout);
    this.process.stderr.unpipe(stderr);
    stdout.end(() => stderr.end());

    // 6: update history with results/error
    currentHistoryRecord.stdout = stdout.getContent();
    currentHistoryRecord.stderr = stderr.getContent();

    if (stderr.isEmpty()) {
      currentHistoryRecord.result = currentHistoryRecord.stdout.toString(this.resultsEncoding);
    } else {
      currentHistoryRecord.hadErrors = true;
      currentHistoryRecord.result = currentHistoryRecord.stderr.toString(this.resultsEncoding);
    }

    this.afterInvoke(currentHistoryRecord.hadErrors);

    // 7: return command result
    this.results.next(currentHistoryRecord);
    // eslint-disable-next-line consistent-return
    return currentHistoryRecord;
  }

  async invoke(command: string): Promise<IShellCommandResult> {
    if (this.isExited) {
      throw new InvocationError('invoke called after process exited');
    }
    return this.invocationQueue.add(() => this.invokeTask(command));
  }

  kill(): boolean {
    if (this.isExited) {
      return true;
    }

    this.process.kill(this.killSignal);
    return this.isSignalReceived();
  }
}

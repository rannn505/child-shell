import { EOL } from 'os';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { Writable } from 'stream';
import { once } from 'events';

import Debugger from 'debug';
import PQueue from 'p-queue';
import ms from 'ms';
import { Subject, fromEvent, race, Observable } from 'rxjs';
import { map, first, mapTo, delay, tap } from 'rxjs/operators';

import { CHUNK_EVENT } from '../stream/AccumulateStream';
import { DomainStream, DOMAIN_EVENT } from '../stream/DomainStream';
import { RotateStream, ROTATE_EVENT } from '../stream/RotateStream';
import { Dash } from './Parameter';
import { Command } from './Command';
import { ProcessError, InvocationError } from './errors';
import { ShellStdioObject, ShellCommandResult, ShellExitData } from './types';
import {
  ShellOptions,
  ProcessOptions,
  ShellHooks,
  BeforeSpawnHookParams,
  AfterSpawnHookParams,
  OnActiveHookParams,
  OnIdleHookParams,
  BeforeInvokeHookParams,
  AfterInvokeHookParams,
  AfterExitHookParams,
} from './options';

export abstract class Shell {
  private readonly debugger: Debugger.Debugger;
  private readonly hooks: { fromOptions: ShellHooks; fromDerived: ShellHooks };
  private readonly executable: string;
  private readonly processOptions: string[];
  private readonly spawnOptions: SpawnOptions;
  private readonly invocationQueue: PQueue;
  private isExited: boolean;
  private readonly killSignal: NodeJS.Signals;
  private readonly process: ChildProcess;
  private readonly exitObserver: Subject<ShellExitData>;
  private readonly resultsEncoding: BufferEncoding;
  readonly streams: ShellStdioObject;
  readonly results: Subject<ShellCommandResult>;
  readonly history: ShellCommandResult[];
  public command: Command;

  constructor(options: ShellOptions, namespace: string, CommandCtor = Command) {
    this.debugger = this.setDebugger(options, namespace);
    this.executable = this.setExecutable(options);
    this.processOptions = this.setProcessOptions(options);
    this.spawnOptions = options.spawnOptions;
    this.hooks = {
      fromOptions: options.hooks ?? {},
      fromDerived: this.setHooks() ?? {},
    };
    this.invocationQueue = this.setInvocationQueue(options);
    this.isExited = false;

    this.debugger(`Starting ${this.executable} ${this.processOptions.join(' ')}`);
    this.beforeSpawn({
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
    this.command = new CommandCtor();
    this.afterSpawn({ process: this.process });
  }

  protected abstract setExecutable({ executable }: { executable?: string }): string;
  protected abstract setProcessOptions({ processOptions }: { processOptions?: ProcessOptions }): string[];
  protected abstract setHooks(): ShellHooks;
  protected abstract writeToOut(input: string): string;
  protected abstract writeToErr(input: string): string;

  private beforeSpawn(params: BeforeSpawnHookParams): void {
    this.hooks.fromDerived?.beforeSpawn?.call?.(this, params);
    this.hooks.fromOptions?.beforeSpawn?.call?.(this, params);
  }

  private afterSpawn(params: AfterSpawnHookParams): void {
    this.hooks.fromDerived?.afterSpawn?.call?.(this, params);
    this.hooks.fromOptions?.afterSpawn?.call?.(this, params);
  }

  private onActive(params: OnActiveHookParams): void {
    this.hooks.fromDerived?.onActive?.call?.(this, params);
    this.hooks.fromOptions?.onActive?.call?.(this, params);
  }

  private onIdle(params: OnIdleHookParams): void {
    this.hooks.fromDerived?.onIdle?.call?.(this, params);
    this.hooks.fromOptions?.onIdle?.call?.(this, params);
  }

  private beforeInvoke(params: BeforeInvokeHookParams): void {
    this.hooks.fromDerived?.beforeInvoke?.call?.(this, params);
    this.hooks.fromOptions?.beforeInvoke?.call?.(this, params);
  }

  private afterInvoke(params: AfterInvokeHookParams): void {
    this.hooks.fromDerived?.afterInvoke?.call?.(this, params);
    this.hooks.fromOptions?.afterInvoke?.call?.(this, params);
  }

  private afterExit(params: AfterExitHookParams): void {
    this.hooks.fromDerived?.afterExit?.call?.(this, params);
    this.hooks.fromOptions?.afterExit?.call?.(this, params);
  }

  private setDebugger(
    { debug, verbose }: { debug?: boolean; verbose?: boolean },
    namespace: string,
  ): Debugger.Debugger {
    const _debugger = Debugger(namespace);
    // eslint-disable-next-line no-console
    _debugger.log = console.log.bind(console);
    if (debug || verbose) {
      Debugger.enable(`${namespace}*`);
    }
    return _debugger;
  }

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
    });
    invocationQueue.onIdle().then(() => {
      this.onIdle({});
    });

    return invocationQueue;
  }

  private clearInvocationQueue(): void {
    this.invocationQueue.pause();
    this.invocationQueue.removeAllListeners();
    this.invocationQueue.clear();
  }

  private setProcessExitListeners(): Subject<ShellExitData> {
    // create process exit observer
    const subject = new Subject<ShellExitData>();

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
    let inError$: Observable<ShellExitData>;
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
    const onProcessExit = (exitData: ShellExitData): void => {
      this.isExited = true;
      this.clearInvocationQueue();
      this.process.stdin.end();
      this.detachStdio(stderr);
      this.debugger(exitData.message);
      this.afterExit({ exitData });
    };

    subject.subscribe({
      next: (exitData: ShellExitData) => onProcessExit(exitData),
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
    const stdout = new DomainStream();
    this.process.stdout.pipe(stdout);
    const stdoutDebugger = this.debugger.extend(this.executable);
    stdout.on(CHUNK_EVENT, (chunk: Buffer): void => stdoutDebugger(chunk.toString(this.resultsEncoding)));

    const stderr = new DomainStream();
    this.process.stderr.pipe(stderr);
    const stderrDebugger = this.debugger.extend(this.executable);
    // eslint-disable-next-line no-console
    stderrDebugger.log = console.error.bind(console);
    stderr.on(CHUNK_EVENT, (chunk: Buffer): void => stderrDebugger(chunk.toString(this.resultsEncoding)));

    // 3: race output and error
    const results = Promise.race([
      this.exitObserver.toPromise(),
      Promise.all([once(stdout, DOMAIN_EVENT), once(stderr, DOMAIN_EVENT)]),
    ]);

    this.debugger('Starting command invocation...');
    this.debugger(`  ${command}`);
    this.beforeInvoke({ command });
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
      this.debugger('Command invocation succeeded');
    } else {
      currentHistoryRecord.hadErrors = true;
      currentHistoryRecord.result = currentHistoryRecord.stderr.toString(this.resultsEncoding);
      this.debugger('Command invocation failed');
    }

    // 7: clean
    this.detachStdio(stdout);
    this.detachStdio(stderr);

    // 8: return command result
    this.afterInvoke({ result: currentHistoryRecord });
    this.results.next(currentHistoryRecord);
    return currentHistoryRecord;
  }

  public addCommand(command: string | Command): this {
    this.command = this.command.addCommand(command);
    return this;
  }

  public addScript(path: string): this {
    this.command = this.command.addScript(path);
    return this;
  }

  public addArgument(argument: string): this {
    this.command = this.command.addArgument(argument);
    return this;
  }

  public addParameter(dash: Dash, name: string, value?: unknown): this {
    this.command = this.command.addParameter(dash, name, value);
    return this;
  }

  public addParameters(parameters: { dash: Dash; name: string; value?: unknown }[] = []): this {
    parameters.forEach((p) => this.addParameter(p.dash, p.name, p.value));
    return this;
  }

  public clear(): this {
    this.command = this.command.clear();
    return this;
  }

  public async invoke(): Promise<ShellCommandResult> {
    if (this.isExited) {
      throw new InvocationError('Invoke called after process exited');
    }
    return this.invocationQueue.add(() => {
      const commandToInvoke = this.command.line;
      this.clear();
      return this.invokeTask(commandToInvoke);
    });
  }

  public async kill(): Promise<ShellExitData> {
    if (!this.isExited) {
      this.process.kill(this.killSignal);
    }
    return this.exitObserver.toPromise();
  }
}

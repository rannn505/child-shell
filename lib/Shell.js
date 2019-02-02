const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const os = require('os');
const shortid = require('shortid');

const PSCommand = require('./PSCommand');

const {
  isWin, isCriticalPSError, logger,
  ShellStreamBuffer, shellSafeWrite,
  getType, convertToPSOption,
} = require('./utils');

const {
  PS_PROC_ERROR,
  PS_ARG_MISS_ERROR,
  PS_ARG_TYPE_ERROR,
  PS_CMD_FAIL_ERROR,
} = require('./errors');

class Shell extends EventEmitter {
  constructor(options = {}) {
    super();

    this.pid = -1;
    this.streams = [];
    this.commands = [];
    this.history = [];
    this.hadErrors = false;
    this.invocationStateInfo = 'NotStarted';
    this.verbose = false;

    let psProc = !isWin ? 'pwsh' : 'powershell';
    let psOpts = ['-NoLogo', '-NoExit', '-Command', '-'];

    if(options.pwsh) {
      psProc = 'pwsh';
    }

    if(options.pwshPrev && !options.pwsh) {
      psProc = 'pwsh-preview';
    }

    if(process.env.NPS) {
      psProc = process.env.NPS;
    }

    if(Object.hasOwnProperty.call(options, 'debugMsg')) {
      logger.warn(`debugMsg will be deprecated soon. use verbose instead.\n
      https://rannn505.gitbook.io/node-powershell/shell/initialize`);
      this.verbose = options.debugMsg;
    }

    if(options.verbose) {
      this.verbose = true;
    }

    Object.keys(options).forEach(optKey => {
      if(['pwsh', 'pwshPrev', 'debugMsg', 'verbose', 'inputEncoding', 'outputEncoding'].includes(optKey)) {
        return;
      }
      const optVal = options[optKey];
      psOpts = [...convertToPSOption(optKey, optVal), ...psOpts];
    });

    const proc = spawn(`${psProc}${!isWin ? '' : '.exe'}`, psOpts, { stdio: 'pipe' });
    this.pid = proc.pid;

    // make sure the PS process start successfully
    if(!this.pid) {
      throw new PS_PROC_ERROR();
    }
    proc.once('error', () => {
      throw new PS_PROC_ERROR();
    });

    // set streams encoding
    proc.stdin.setDefaultEncoding(options.inputEncoding || 'utf8');
    proc.stdout.setEncoding(options.outputEncoding || 'utf8');
    proc.stderr.setEncoding(options.outputEncoding || 'utf8');

    // handle startup errors
    const psErr = new ShellStreamBuffer();
    proc.stderr.pipe(psErr);

    proc.stdin.on('error', err => {
      if (['ECONNRESET', 'EPIPE'].includes(err.code)) {
        // handle epipe
        setTimeout(() => {
          if(psErr.isEmpty()) {
            throw err; // real epipe
          }
        });
        return; // ignore here so proc.once('close') will handle error
      }
      throw err; // fallback
    });

    proc.once('close', code => {
      psErr.end();
      this.emit('end', code);
      this.verbose && logger.info(`PS process ${this.pid} exited with code ${code}`);

      if(!psErr.isEmpty() && isCriticalPSError(psErr.getContents())) {
        throw new PS_PROC_ERROR(psErr.getContentsAsString());
      }
    });

    this.invoke = this.invoke.bind(this, proc);
    this.stop = this.stop.bind(this, proc);
    this.dispose = this.dispose.bind(this, proc);

    this.streams = {
      stdin: proc.stdin,
      stdout: proc.stdout,
      stderr: proc.stderr,
    };
  }
  addCommand(command = '', params = []) {
    return new Promise(resolve => {
      if(!(command instanceof PSCommand)) {
        command = new PSCommand(command);
      }

      this.commands.push(command);

      if(params && params.length > 0) {
        logger.warn(`params argument for addCommand method will be deprecated soon. use addParameter or addParameters instead.\n
        https://rannn505.gitbook.io/node-powershell/shell/addCommand`);
        return this.addParameters(params);
      }

      return resolve(this.commands);
    });
  }
  addArgument(argument = '') {
    if(this.commands.length === 0) {
      return Promise.reject(new PS_ARG_MISS_ERROR('Commands array is empty. please add at least one command before you use addArgument()'));
    }
    let lastCommand = this.commands.pop();
    lastCommand = lastCommand.addArgument(argument);
    return this.addCommand(lastCommand);
  }
  addParameter(parameter = {}) {
    if(this.commands.length === 0) {
      return Promise.reject(new PS_ARG_MISS_ERROR('Commands array is empty. please add at least one command before you use addParameter()'));
    }
    let lastCommand = this.commands.pop();
    lastCommand = lastCommand.addParameter(parameter);
    return this.addCommand(lastCommand);
  }
  addParameters(parameters = []) {
    if(getType(parameters) !== 'Array') {
      throw new PS_ARG_TYPE_ERROR('Parameters must be an array');
    }
    if(parameters.length === 0) {
      throw new PS_ARG_MISS_ERROR('Parameters are missing');
    }

    return Promise.all(parameters.map(this.addParameter, this))
      .then(() => Promise.resolve(this.commands));
  }
  clear() {
    this.commands = [];
    return Promise.resolve(this.commands);
  }
  invoke() {
    return new Promise((resolve, reject) => {
      this.invocationStateInfo = 'NotStarted'; // https://docs.microsoft.com/en-us/dotnet/api/system.management.automation.psinvocationstate?view=powershellsdk-1.1.0
      const EOI = shortid.generate();
      const invocationCommands = this.commands.map(psCommand => psCommand.command).join('; ');
      let invocationHadErrors = false;

      const psOut = new ShellStreamBuffer(EOI);
      this.streams.stdout.pipe(psOut);
      this.streams.stderr.pipe(psOut);

      this.streams.stderr.once('data', () => {
        invocationHadErrors = true;
      });
      psOut.once('EOI', () => {
        this.streams.stdout.unpipe(psOut);
        this.streams.stderr.unpipe(psOut);
        psOut.end();

        const output = psOut.getContentsAsString();
        this.history.push({
          commands: invocationCommands,
          hadErrors: invocationHadErrors,
          results: psOut.getContents(),
        });
        this.commands = [];

        if(invocationHadErrors) {
          this.invocationStateInfo = this.invocationStateInfo !== 'Stopping' ? 'Failed' : 'Stopped';
          this.verbose && logger.error('Command invoke failed');
          this.emit('err', new PS_CMD_FAIL_ERROR(output));
          return reject(new PS_CMD_FAIL_ERROR(output));
        }
        this.invocationStateInfo = this.invocationStateInfo !== 'Stopping' ? 'Completed' : 'Stopped';
        this.verbose && logger.ok('Command invoke completed');
        this.emit('output', output);
        return resolve(output);
      });

      shellSafeWrite(this.streams.stdin, invocationCommands)
        .then(() => shellSafeWrite(this.streams.stdin, os.EOL))
        .then(() => {
          this.invocationStateInfo = 'Running';
          if(this.verbose) {
            logger.info('Command invoke started');
            logger.debug(invocationCommands);
          }
        })
        // .then(() => shellSafeWrite(this.streams.stdin, `[Console]::Error.Write("${EOI}")`))
        // .then(() => shellSafeWrite(this.streams.stdin, os.EOL))
        .then(() => shellSafeWrite(this.streams.stdin, `[Console]::Out.Write("${EOI}")`))
        .then(() => shellSafeWrite(this.streams.stdin, os.EOL));
    });
  }
  stop(proc) {
    if(this.invocationStateInfo === 'Running') {
      proc.kill(os.constants.signals.SIGABRT);
      this.invocationStateInfo = 'Stopping';
    }
    return Promise.resolve();
  }
  dispose() {
    return shellSafeWrite(this.streams.stdin, 'exit')
      .then(() => shellSafeWrite(this.streams.stdin, os.EOL))
      .then(() => {
        this.streams.stdin.end();
        this.dispose = () => {};
        return Promise.resolve();
      });
  }
}

module.exports = Shell;

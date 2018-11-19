const os               = require('os');
const { EventEmitter } = require('events');
const { spawn }        = require('child_process');
const Promise          = require('bluebird');

const { ShellStream, ShellWrite, toPS } = require('./Utils');
const { MODULE_NAME, IS_WIN,
  MODULE_MSG, INFO_MSG, OK_MSG, ERROR_MSG, MSGS } = require('./Constants');


/**
 * The Shell class.
 *
 * @constructor
 * @param {Object} config The config for the shell instance. https://github.com/rannn505/node-powershell#initializeconstructor
 * @returns {Shell} A Shell instance which allows you to run PowerShell commands from your NodeJS app.
 * It exposes a simple API that bridges between your node and a PS child process.
 */
export class Shell extends EventEmitter {
  constructor({
    inputEncoding: inputEncoding = 'utf8',
    outputEncoding: outputEncoding = 'utf8',
    debugMsg: debugMsg = true,
    verbose: verbose = true,
    executionPolicy: executionPolicy = 'Unrestricted',
    noProfile: noProfile = true,
    usePwsh: usePwsh = false,
    EOI: EOI = 'EOI',
    version
  } = {}) {
    super();

    // cmds bulk to run at the next invoke call
    this._cmds = [];
    // history of cmds
    this._history = [];
    // global config for class
    this._cfg = {};
    this._cfg.verbose = debugMsg && verbose;
    this._cfg.EOI = EOI;

    // arguments for PowerShell process
    let args = ['-NoLogo', '-NoExit', '-InputFormat', 'Text', '-Command', '-'];
    if(noProfile) {
      args = ['-NoProfile', ...args];
    }
    if(IS_WIN) {
      args = ['-ExecutionPolicy', executionPolicy, ...args];
    }
    if(version) {
      args = ['-Version', version, ...args];
    }

    // the PowerShell process
    this._proc = spawn(`${usePwsh ? 'pwsh' : 'powershell'}${IS_WIN ? '.exe' : ''}`, args, { stdio: 'pipe' });

    // Make sure the PS process start successfully
    if(!this._proc.pid) {
      throw new Error(MSGS.INIT.ERROR.START_PS);
    }
    this._proc.on('error', error => {
      throw new Error(MSGS.INIT.ERROR.START_PS);
    });

    // Set streams encoding
    this._proc.stdin.setDefaultEncoding(inputEncoding);
    this._proc.stdout.setEncoding(outputEncoding);
    this._proc.stderr.setEncoding(outputEncoding);

    // handle current output
    const output = new ShellStream(this._cfg.EOI);
    let hasError = false;

    this._proc.stdout.pipe(output);
    this._proc.stderr.pipe(output);
    this._proc.stderr.on('data', (data) => {
      hasError = true;
    });

    this._proc.on('close', code => {
      this.emit('end', code);
      let exitMsg = `Process ${this._proc.pid} exited with code ${code}\n`;
      if(hasError) {
        // PS process failed to start
        this._print(ERROR_MSG(exitMsg));
        // this._print(ERROR_MSG(Buffer.concat(output.stdout).toString()));
        throw new Error(Buffer.concat(output.stdout).toString().replace(/\0/g, ''));
      } else {
        // dispose
        if(code !== 0) {
          this._print(ERROR_MSG(exitMsg));
          this._reject(ERROR_MSG(`script exit ${code}`));
        } else {
          this._print(OK_MSG(exitMsg));
          this._resolve(`script exit ${code}`);
        }
      }
    });

    output.on('EOI', (data) => {
      if(hasError) {
        this.emit('err', data);
        this._print(MSGS.INVOKE.ERROR.CMD_FAIL);
        this._reject(ERROR_MSG(data));
      } else {
        this.emit('output', data);
        this._print(MSGS.INVOKE.OK.CMD_FINISH);
        this._resolve(data);
      }
      hasError = false;
    });

    // public props
    this.history = this._history;
    this.streams = {
      stdin: this._proc.stdin,
      stdout: this._proc.stdout,
      stderr: this._proc.stderr
    };

    this._print(OK_MSG(`Process ${this._proc.pid} started\n`));
  }
  _print(msg) {
    this._cfg.verbose && console.log(`${MODULE_MSG} ${msg}`);
  }
  addCommand(command, params = []) {
    return new Promise((resolve, reject) => {
      if(!command) {
        return reject(MSGS.ADD_COMMAND.ERROR.CMD_MISS);
      }
      if(!Array.isArray(params)) {
        return reject(MSGS.ADD_COMMAND.ERROR.PARAMS_TYPE);
      }
      let cmdStr = `${command}`;
      for (const param of params) {
        let paramType =  Object.prototype.toString.call(param).slice(8, -1);
        if(paramType === 'Object') {
          // param is {name: '', value: ''} or {name: value}
          let paramKeys = Object.keys(param);
          let paramName, paramValue;
          if(paramKeys.length === 2 && paramKeys[0] === 'name' && paramKeys[1] === 'value') {
            // param is {name: '', value: ''}
            paramName = param.name;
            paramValue = param.value;
          } else if(paramKeys.length === 1 && paramKeys[0]) {
            // param is {name: value}
            paramName = paramKeys[0];
            paramValue = param[paramName];
          } else {
            return reject(MSGS.ADD_COMMAND.ERROR.PARAM_STRUCT);
          }
          // cast a parameter value from JS data types to PowerShell data types.
          paramValue = toPS(paramValue);
          // determine whether @ syntax used in cmd
          let isReplaced = false;
          cmdStr = cmdStr.replace(`@${paramName}`, match => {
            isReplaced = true;
            return `-${paramName} ${paramValue}`
          });
          if(!isReplaced) {
            cmdStr = cmdStr.concat(` -${paramName}${paramValue ? ' ' + paramValue : ''}`);
          }
        } else if(paramType === 'String') {
          // param is switch
          cmdStr = cmdStr.concat(` -${param}`);
        } else {
          return reject(MSGS.ADD_COMMAND.ERROR.PARAM_TYPE);
        }
      }
      this._cmds.push(cmdStr);
      this._history.push(cmdStr);
      resolve(this._cmds);
    });
  }
  invoke() {
    return new Promise((resolve, reject) => {
      // Make resolve, reject accessible to the class
      this._resolve = resolve;
      this._reject = reject;

      let cmdsStr = this._cmds.join('; ');
      ShellWrite(this._proc.stdin, cmdsStr)
      .then(() => ShellWrite(this._proc.stdin, os.EOL))
      .then(() => ShellWrite(this._proc.stdin, `echo ${this._cfg.EOI}`))
      .then(() => ShellWrite(this._proc.stdin, os.EOL));

      this._print(MSGS.INVOKE.OK.CMD_START);
      this._print(INFO_MSG(cmdsStr));
      // this._cfg.verbose && console.log(` ${colors.gray(cmdsStr)}`);
      this._cmds = [];
    });
  }
  dispose() {
    return new Promise((resolve, reject) => {
      // Make resolve, reject accessible to the class
      this._resolve = resolve;
      this._reject = reject;

      ShellWrite(this._proc.stdin, 'exit')
      .then(() => ShellWrite(this._proc.stdin, os.EOL))
      .then(() => this._proc.stdin.end())
    });
  }
}

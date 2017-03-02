const os           = require('os');
const util         = require('util');
const eventEmitter = require('events').EventEmitter;
const spawn        = require('child_process').spawn;
const colors       = require('chalk');
const promise      = require('bluebird');

const MODULE_NAME = 'node-powershell';
const IS_WIN      = os.platform() === 'win32';
const MODULE_MSG  = colors.bold.blue(`NPS> `);
const OK_MSG      = colors.green;
const ERROR_MSG   = colors.red;
const EOI         = 'EOI';


/**
 * The Shell class.
 *
 * @constructor
 * @param {Object} config The config for the shell instance. https://github.com/rannn505/node-powershell#initializeconstructor
 * @returns {Shell} A Shell instance which allows you to run PowerShell commands from your NodeJS app.
 * It exposes a simple API that bridges between your node and a PS child process.
 */
export class Shell extends eventEmitter {
  constructor({
    executionPolicy: executionPolicy = 'Unrestricted',
    inputEncoding: inputEncoding = 'utf8',
    outputEncoding: outputEncoding = 'utf8',
    debugMsg: debugMsg = true,
    noProfile: noProfile = true,
  } = {}) {
    super();

    // cmds bulk to run at the next invoke call
    this._cmds = [];
    // history of cmds
    this._history = [];
    // global config for class
    this._cfg = {};
    this._cfg.debugMsg = debugMsg;

    // arguments for PowerShell process
    let _args = ['-NoLogo', '-NoExit', '-InputFormat', 'Text', '-Command', '-'];
    if(noProfile) {
      _args = ['-NoProfile', ..._args];
    }
    if(IS_WIN) {
      _args = ['-ExecutionPolicy', executionPolicy, ..._args];
    }

    // the PowerShell process
    this._proc = spawn(`powershell${IS_WIN ? '.exe' : ''}`, _args, {
      stdio: 'pipe'
    });
    if(!this._proc.pid) {
      throw new Error(`Opss... ${MODULE_NAME} was unable to start PowerShell.\nPlease make sure that PowerShell is installed properly on your system, and try again.`);
    }
    this._proc.on('error', error => {
      throw new Error(`Opss... ${MODULE_NAME} was unable to start PowerShell.\nPlease make sure that PowerShell is installed properly on your system, and try again.`);
    });
    this._proc.stdin.setEncoding(inputEncoding);
    this._proc.stdout.setEncoding(outputEncoding);
    this._proc.stderr.setEncoding(outputEncoding);

    // output to print after invoke call
    let _output = [];
    let _type = '_resolve';

    this._proc.stdout.on('data', data => {
      if(data.indexOf(EOI) !== -1) {
        this.emit(_type, _output.join(''));
        _output = [];
        _type = '_resolve';
      }
      else {
        this.emit('output', data);
        _output.push(data);
      }
    });
    this._proc.stderr.on('data', error => {
      this.emit('err', error);
      _output.push(error);
      _type = '_reject';
    });

    // public props
    this.history = this._history;
    this.streams = {
      stdin: this._proc.stdin,
      stdout: this._proc.stdout,
      stderr: this._proc.stderr
    };

    this.__print__(OK_MSG, `Process ${this._proc.pid} started\n`);
  }
  __print__(type, msg) {
    this._cfg.debugMsg && console.log(`${MODULE_MSG} ${type(msg)}`);
  }
  addCommand(command, params = []) {
    const _self = this;
    return new Promise(function(resolve, reject) {
      if(!command) {
        return reject(ERROR_MSG(`Command is missing`));
      }
      if(!Array.isArray(params)) {
        return reject(ERROR_MSG(`Params must be an array`));
      }
      let _cmdStr = `${command}`;
      for (const param of params) {
        let _type =  Object.prototype.toString.call(param).slice(8, -1);
        if(_type === 'Object') {
          // param is {name: '', value: ''} or {name: value}
          let _keys = Object.keys(param);
          let _name, _value;
          if(_keys.length === 2 && _keys[0] === 'name' && _keys[1] === 'value') {
            // param is {name: '', value: ''}
            _name = param.name;
            _value = param.value;
          }
          else if(_keys.length === 1 && _keys[0]) {
            // param is {name: value}
            _name = _keys[0];
            _value = param[_name];
          }
          else {
            return reject(ERROR_MSG(`All objecct params need to be {name: '', value: ''} or {name: value} structure`));
          }
          // cast param value from JS data types to PowerShell data types.
          switch (Object.prototype.toString.call(_value).slice(8, -1)) {
            case 'String':
              _value = /\s/.test(_value) || (_value.indexOf('<') !== -1 && _value.indexOf('>') !== -1) ? '"'+_value+'"' : _value;
              break;
            case 'Number':
              _value = _value;
              break;
            case 'Array':
              _value = _value;
              break;
            case 'Boolean':
              _value = _value ? '$True' : '$False';
              break;
            case 'Date':
              _value = _value.toLocaleString();
              break;
            case 'Undefined' || 'Null':
              // param is switch
              _value = _value;
              break;
            default:
              _value = /\s/.test(_value) ? '"'+_value+'"' : _value;
          }
          let _replaced = false;
          _cmdStr = _cmdStr.replace(`@${_name}`, match => {
            _replaced = true;
            return `-${_name} ${_value}`
          });
          if(!_replaced) {
            _cmdStr = _cmdStr.concat(` -${_name}${_value ? ' '+_value : ''}`);
          }
        }
        else if(_type === 'String') {
          // param is switch
          _cmdStr = _cmdStr.concat(` -${param}`);
        }
        else {
          return reject(ERROR_MSG(`All Params need to be objects or strings`));
        }
      };
      _self._cmds.push(_cmdStr);
      _self._history.push(_cmdStr);
      return resolve(_self._cmds);
    });
  }
  invoke() {
    const _self = this;
    return new Promise(function(resolve, reject) {
      let _cmdsStr = _self._cmds.join('; ');
      _self.__print__(OK_MSG, `Command invoke started`);
      _self._cfg.debugMsg && console.log(` ${colors.gray(_cmdsStr)}`)

      function resolve_listener(data) {
        _self.__print__(OK_MSG, `Command invoke finished\n`);
        reset();
        return resolve(data);
      }
      function reject_listener(error) {
        _self.__print__(ERROR_MSG, `Command invoke failed\n`);
        reset();
        return reject(ERROR_MSG(error));
      }
      function reset() {
        _self.removeListener('_resolve', resolve_listener);
        _self.removeListener('_reject', reject_listener);
        _self._cmds = [];
      }

      _self.on('_resolve', resolve_listener);
      _self.on('_reject', reject_listener);

      _self._proc.stdin.write(_cmdsStr);
      _self._proc.stdin.write(os.EOL);
      _self._proc.stdin.write(`echo ${EOI}`);
      _self._proc.stdin.write(os.EOL);
    });
  }
  dispose() {
    const _self = this;
    return new Promise(function(resolve, reject) {
      _self._proc.on('close', code => {
        let _exitMsg = `Process ${_self._proc.pid} exited with code ${code}\n`;
        _self.emit('end', code);
        if(code == 1) {
          _self.__print__(ERROR_MSG, _exitMsg);
          return reject(ERROR_MSG(`script exit ${code}`));
        }
        else {
          _self.__print__(OK_MSG, _exitMsg);
          return resolve(`script exit ${code}`);
        }
      });

      _self._proc.stdin.write('exit');
      _self._proc.stdin.write(os.EOL);
      _self._proc.stdin.end();
    });
  }
}

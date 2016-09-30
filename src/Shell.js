var os           = require('os');
var util         = require('util');
var eventEmitter = require('events').EventEmitter;
var spawn        = require('child_process').spawn;
var colors       = require('chalk');
var promise      = require('bluebird');

const MODULE_NAME = 'node-powershell';
const IS_WIN      = os.platform() === 'win32';
const MODULE_MSG  = colors.bold.blue(`<${MODULE_NAME}>:: `);
const MODULE_MSG2 = colors.bold.blue(`NPS> `);
const OK_MSG      = colors.green;
const ERROR_MSG   = colors.red;


/**
 * The PS Shell class.
 * @param {object} opt - options fot the shell
 * @returns {Shell}
 * @constructor
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
        this._commands = '';
        this._history = [];
        this._output = '';
        this._opt = {};
        this._opt.debugMsg = debugMsg;

        let _args = ['-NoLogo', '-NoExit', '-InputFormat', 'Text', '-Command', '-'];

        if(noProfile) {
            _args = ['-NoProfile', ..._args];
        }

        if(IS_WIN) {
            _args = ['-ExecutionPolicy', executionPolicy, ..._args];
        }

        let _procname = `powershell${IS_WIN ? '.exe' : ''}`;

        this._proc = spawn(_procname, _args, {
            stdio: 'pipe'
        });

        if(!this._proc.pid) {
            throw new Error(`Opss... ${MODULE_NAME} was unable to start PowerShell.\nPlease make sure that PowerShell is installed properly on your system, and try again.`);
        }

        this._proc.stdin.setEncoding(inputEncoding);
        this._proc.stdout.setEncoding(outputEncoding);
        this._proc.stderr.setEncoding(outputEncoding);

        this._proc.stdout.on('data', data => {
            if (data.indexOf('EOI') === -1) {
                this.emit('output', data);
                this._output += data;
            } else {
                this.emit('_resolve', this._output);
                this._output = '';
                this._commands = '';
            }
        });

        this._proc.stderr.on('data', error => {
            this.emit('err', error);
            this.emit('_reject', error);
            this._output = '';
            this._commands = '';
        });
        this._proc.on('error', error => {
            this.emit('err', error);
            this.emit('_reject', error);
            this._output = '';
            this._commands = '';
        });

        this.history = this._history;
        this.streams = {
            stdin: this._proc.stdin,
            stdout: this._proc.stdout,
            stderr: this._proc.stderr
        };

        (this._opt.debugMsg) && console.log(MODULE_MSG2 + OK_MSG(`Process ${this._proc.pid} started\n`));
    }
    addCommand(command, params = []) {
        return new Promise((resolve, reject) => {
            var _command = ` ${command}`;
            params.forEach(param => {
                _command = _command.concat(` -${param.name} "${param.value}"`);
            });
            _command = _command.concat(`;`);

            this._commands = this._commands.concat(`${_command}`);
            this._history.push(_command);
            resolve(this._commands);
        });
    }
    invoke() {
        var _shell = this;

        (this._opt.debugMsg) && console.log(MODULE_MSG2 + OK_MSG(`Command invoke started\n`));
        (this._opt.debugMsg) && console.log(OK_MSG(`${this._commands}\n`));

        return new Promise((resolve, reject) => {
            var output = '';

            this._proc.stdin.write(this._commands);
            this._proc.stdin.write(os.EOL);
            this._proc.stdin.write('echo EOI');
            this._proc.stdin.write(os.EOL);

            function clean_listeners() {
                _shell.removeListener('_resolve', resolve_listener);
                _shell.removeListener('_reject', reject_listener);
            }

            function resolve_listener(output) {
                resolve(output);
                clean_listeners();
                (_shell._opt.debugMsg) && console.log(MODULE_MSG2 + OK_MSG(`Command invoke finished\n`));
            }

            function reject_listener(error) {
                reject(error);
                clean_listeners();
                (_shell._opt.debugMsg) && console.log(MODULE_MSG2 + ERROR_MSG(`Command invoke failed\n`));
            }

            this.on('_resolve', resolve_listener);
            this.on('_reject', reject_listener);
        });
    }
    dispose() {
        var _shell = this;

        return new Promise((resolve, reject) => {
            this._proc.stdin.write('exit');
            this._proc.stdin.write(os.EOL);
            this._proc.stdin.end();
            // this._proc.kill();

            this._proc.on('close', code => {
                (this._opt.debugMsg) && console.log(MODULE_MSG2 + OK_MSG(`Process ${this._proc.pid} exited with code ${code}\n`));

                setTimeout(function() {
                    _shell.emit('end', code);
                    (code == 1) && reject('script exit 1');
                    resolve(code);
                }, 10);
            });
        });
    }
}

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var os = require('os');
var util = require('util');
var eventEmitter = require('events').EventEmitter;
var spawn = require("child_process").spawn;
var colors = require('chalk');
var promise = require('bluebird');

var MODULE_NAME = 'node-powershell';
var ERROR_COLOR = colors.bold.red;

/**
 * The PS Shell class.
 * @param {object} opt - options fot the shell
 * @returns {Shell}
 * @constructor
 */

var Shell = exports.Shell = function (_eventEmitter) {
    _inherits(Shell, _eventEmitter);

    function Shell() {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref$executionPolicy = _ref.executionPolicy;
        var executionPolicy = _ref$executionPolicy === undefined ? 'Unrestricted' : _ref$executionPolicy;
        var _ref$inputEncoding = _ref.inputEncoding;
        var inputEncoding = _ref$inputEncoding === undefined ? 'utf8' : _ref$inputEncoding;
        var _ref$outputEncoding = _ref.outputEncoding;
        var outputEncoding = _ref$outputEncoding === undefined ? 'utf8' : _ref$outputEncoding;
        var _ref$debugMsg = _ref.debugMsg;
        var debugMsg = _ref$debugMsg === undefined ? true : _ref$debugMsg;

        _classCallCheck(this, Shell);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Shell).call(this));

        _this._commands = '';
        _this._history = [];
        _this._output = '';
        _this._opt = {};
        _this._opt.debugMsg = debugMsg;

        var _args = ['-NoLogo', '-NoExit', '-NoProfile', '-InputFormat', 'Text', '-ExecutionPolicy', executionPolicy, '-Command', '-'];
        _this._proc = spawn("powershell.exe", _args, {
            stdio: 'pipe'
        });

        _this._proc.stdin.setEncoding(inputEncoding);
        _this._proc.stdout.setEncoding(outputEncoding);
        _this._proc.stderr.setEncoding(outputEncoding);

        _this._proc.stdout.on('data', function (data) {
            if (data.indexOf('EOI') === -1) {
                _this.emit('output', data);
                _this._output += data;
            } else {
                _this.emit('_resolve', _this._output);
                _this._output = '';
                _this._commands = '';
            }
        });

        _this._proc.stderr.on('data', function (error) {
            _this.emit('err', error);
            _this.emit('_reject', error);
            _this._output = '';
            _this._commands = '';
        });
        _this._proc.on('error', function (error) {
            _this.emit('err', error);
            _this.emit('_reject', error);
            _this._output = '';
            _this._commands = '';
        });

        _this.history = _this._history;
        _this.streams = {
            stdin: _this._proc.stdin,
            stdout: _this._proc.stdout,
            stderr: _this._proc.stderr
        };

        _this._opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Process ' + _this._proc.pid + ' started\n'));
        return _this;
    }

    _createClass(Shell, [{
        key: 'addCommand',
        value: function addCommand(command) {
            var _this2 = this;

            var params = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

            return new Promise(function (resolve, reject) {
                var _command = ' ' + command;
                params.forEach(function (param) {
                    _command = _command.concat(' -' + param.name + ' "' + param.value + '"');
                });
                _command = _command.concat(';');

                _this2._commands = _this2._commands.concat('' + _command);
                _this2._history.push(_command);
                resolve(_this2._commands);
            });
        }
    }, {
        key: 'invoke',
        value: function invoke() {
            var _this3 = this;

            var _shell = this;

            this._opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Command invoke started\n'));
            this._opt.debugMsg && console.log(colors.green(this._commands + '\n'));

            return new Promise(function (resolve, reject) {
                var output = '';

                _this3._proc.stdin.write(_this3._commands);
                _this3._proc.stdin.write(os.EOL);
                _this3._proc.stdin.write('echo EOI');
                _this3._proc.stdin.write(os.EOL);

                function clean_listeners() {
                    _shell.removeListener('_resolve', resolve_listener);
                    _shell.removeListener('_reject', reject_listener);
                }

                function resolve_listener(output) {
                    resolve(output);
                    clean_listeners();
                    _shell._opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Command invoke finished\n'));
                }

                function reject_listener(error) {
                    reject(error);
                    clean_listeners();
                    _shell._opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Command invoke failed\n'));
                }

                _this3.on('_resolve', resolve_listener);
                _this3.on('_reject', reject_listener);
            });
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            var _this4 = this;

            var _shell = this;

            return new Promise(function (resolve, reject) {
                _this4._proc.stdin.write('exit');
                _this4._proc.stdin.write(os.EOL);
                _this4._proc.stdin.end();
                // this._proc.kill();

                _this4._proc.on('close', function (code) {
                    _this4._opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Process ' + _this4._proc.pid + ' exited with code ' + code + '\n'));

                    setTimeout(function () {
                        _shell.emit('end', code);
                        code == 1 && reject('script exit 1');
                        resolve(code);
                    }, 10);
                });
            });
        }
    }]);

    return Shell;
}(eventEmitter);
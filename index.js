'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Created by Ran Cohen on 20/07/2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var spawn = require("child_process").spawn;
var colors = require('chalk');
var promise = require('bluebird');

var MODULE_NAME = 'node-powershell';
var ERROR_COLOR = colors.bold.red;

/**
 * The PS Shell class.
 * @param {string} cmdlets - the commends/script`s path to run.
 * @param {object} opt - options fot the shell
 * @returns {Shell}
 * @constructor
 */

var Shell = function (_EventEmitter) {
    _inherits(Shell, _EventEmitter);

    function Shell(cmdlets) {
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$executionPolicy = _ref.executionPolicy;
        var executionPolicy = _ref$executionPolicy === undefined ? 'Unrestricted' : _ref$executionPolicy;
        var _ref$outputEncoding = _ref.outputEncoding;
        var outputEncoding = _ref$outputEncoding === undefined ? 'utf8' : _ref$outputEncoding;
        var _ref$debugMsg = _ref.debugMsg;
        var debugMsg = _ref$debugMsg === undefined ? true : _ref$debugMsg;

        _classCallCheck(this, Shell);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Shell).call(this));

        _this.cmdlets = cmdlets;
        _this.opt = {};
        _this.opt.executionPolicy = executionPolicy;_this.opt.outputEncoding = outputEncoding;_this.opt.debugMsg = debugMsg;
        return _this;
    }

    _createClass(Shell, [{
        key: 'execute',
        value: function execute() {
            var _this2 = this;

            var _shell = this;

            var _args = ['-ExecutionPolicy', this.opt.executionPolicy, '-Command', '& ' + this.cmdlets];
            var _proc = spawn("powershell.exe", _args, { stdio: ['ignore', 'pipe', 'pipe'] });

            _proc.stdout.setEncoding(this.opt.outputEncoding);
            _proc.stderr.setEncoding(this.opt.outputEncoding);

            this.opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Process ' + _proc.pid + ' started\n'));

            return new Promise(function (resolve, reject) {
                var output = "";

                _proc.stdout.on('data', function (data) {
                    _shell.emit('output', data);
                    output += data;
                });
                _proc.stderr.on('data', function (data) {
                    _shell.emit('output', data);
                });
                _proc.on('error', function (error) {
                    _shell.emit('error', error);
                    reject(error);
                });
                _proc.on('close', function (code) {
                    _this2.opt.debugMsg && console.log(colors.blue('<' + MODULE_NAME + '>:: ') + colors.green('Process ' + _proc.pid + ' exited with code ' + code + '\n'));

                    setTimeout(function () {
                        _shell.emit('end', code);

                        code == 1 && reject('script exit 1');
                        resolve({ code: code, output: output.trim() });
                    }, 10);
                });
            });
        }
    }], [{
        key: 'executionStringBuilder',
        value: function executionStringBuilder(path) {
            var params = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

            return new Promise(function (resolve, reject) {
                (typeof path === 'undefined' || !path) && reject('script exit 1');
                var str = path;
                params.forEach(function (param) {
                    str = str.concat(' -' + param.name + ' "' + param.value + '"');
                });
                resolve(str);
            });
        }
    }]);

    return Shell;
}(EventEmitter);

/**
 * The ShellManager class.
 * @returns {ShellManager}
 * @constructor
 */


var ShellManager = function () {
    function ShellManager() {
        var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var _ref2$maxParallel = _ref2.maxParallel;
        var maxParallel = _ref2$maxParallel === undefined ? 4 : _ref2$maxParallel;

        _classCallCheck(this, ShellManager);

        this.shellsQueue = [];
        this.opt = {};
        this.opt.maxParallel = maxParallel;
    }

    _createClass(ShellManager, [{
        key: 'queue',
        value: function queue(shell) {
            if (shell instanceof Shell) {
                this.shellsQueue.push(shell);
            } else {
                throw new TypeError('param is not instanceof Shell');
            }
        }
    }, {
        key: 'execute',
        value: function execute() {
            return promise.map(this.shellsQueue, function (shell) {
                return shell.execute();
            }, { concurrency: this.opt.maxParallel });
        }
    }]);

    return ShellManager;
}();

module.exports = {
    Shell: Shell,
    ShellManager: ShellManager
};
exports.default = Shell;
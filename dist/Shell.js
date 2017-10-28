/*********************************************************
 * node-powershell - Easily run PowerShell from your NodeJS app
 * @version v3.3.1
 * @link http://rannn505.github.io/node-powershell/
 * @copyright Copyright (c) 2017 Ran Cohen <rannn505@outlook.com>
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @Compiled At: 2017-10-28
  *********************************************************/
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var os = require('os');

var _require = require('events'),
    EventEmitter = _require.EventEmitter;

var _require2 = require('child_process'),
    spawn = _require2.spawn;

var Promise = require('bluebird');

var _require3 = require('./Utils'),
    ShellStream = _require3.ShellStream,
    ShellWrite = _require3.ShellWrite,
    toPS = _require3.toPS;

var _require4 = require('./Constants'),
    MODULE_NAME = _require4.MODULE_NAME,
    IS_WIN = _require4.IS_WIN,
    MODULE_MSG = _require4.MODULE_MSG,
    INFO_MSG = _require4.INFO_MSG,
    OK_MSG = _require4.OK_MSG,
    ERROR_MSG = _require4.ERROR_MSG,
    MSGS = _require4.MSGS;

/**
 * The Shell class.
 *
 * @constructor
 * @param {Object} config The config for the shell instance. https://github.com/rannn505/node-powershell#initializeconstructor
 * @returns {Shell} A Shell instance which allows you to run PowerShell commands from your NodeJS app.
 * It exposes a simple API that bridges between your node and a PS child process.
 */


var Shell = exports.Shell = function (_EventEmitter) {
  _inherits(Shell, _EventEmitter);

  function Shell() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$inputEncoding = _ref.inputEncoding,
        inputEncoding = _ref$inputEncoding === undefined ? 'utf8' : _ref$inputEncoding,
        _ref$outputEncoding = _ref.outputEncoding,
        outputEncoding = _ref$outputEncoding === undefined ? 'utf8' : _ref$outputEncoding,
        _ref$debugMsg = _ref.debugMsg,
        debugMsg = _ref$debugMsg === undefined ? true : _ref$debugMsg,
        _ref$verbose = _ref.verbose,
        verbose = _ref$verbose === undefined ? true : _ref$verbose,
        _ref$executionPolicy = _ref.executionPolicy,
        executionPolicy = _ref$executionPolicy === undefined ? 'Unrestricted' : _ref$executionPolicy,
        _ref$noProfile = _ref.noProfile,
        noProfile = _ref$noProfile === undefined ? true : _ref$noProfile,
        _ref$EOI = _ref.EOI,
        EOI = _ref$EOI === undefined ? 'EOI' : _ref$EOI,
        version = _ref.version;

    _classCallCheck(this, Shell);

    // cmds bulk to run at the next invoke call
    var _this = _possibleConstructorReturn(this, (Shell.__proto__ || Object.getPrototypeOf(Shell)).call(this));

    _this._cmds = [];
    // history of cmds
    _this._history = [];
    // global config for class
    _this._cfg = {};
    _this._cfg.verbose = debugMsg && verbose;
    _this._cfg.EOI = EOI;

    // arguments for PowerShell process
    var args = ['-NoLogo', '-NoExit', '-InputFormat', 'Text', '-Command', '-'];
    if (noProfile) {
      args = ['-NoProfile'].concat(_toConsumableArray(args));
    }
    if (IS_WIN) {
      args = ['-ExecutionPolicy', executionPolicy].concat(_toConsumableArray(args));
    }
    if (version) {
      args = ['-Version', version].concat(_toConsumableArray(args));
    }

    // the PowerShell process
    _this._proc = spawn('powershell' + (IS_WIN ? '.exe' : ''), args, { stdio: 'pipe' });

    // Make sure the PS process start successfully
    if (!_this._proc.pid) {
      throw new Error(MSGS.INIT.ERROR.START_PS);
    }
    _this._proc.on('error', function (error) {
      throw new Error(MSGS.INIT.ERROR.START_PS);
    });

    // Set streams encoding
    _this._proc.stdin.setDefaultEncoding(inputEncoding);
    _this._proc.stdout.setEncoding(outputEncoding);
    _this._proc.stderr.setEncoding(outputEncoding);

    // handle current output
    var output = new ShellStream(_this._cfg.EOI);
    var hasError = false;

    _this._proc.stdout.pipe(output);
    _this._proc.stderr.pipe(output);
    _this._proc.stderr.on('data', function (data) {
      hasError = true;
    });

    _this._proc.on('close', function (code) {
      _this.emit('end', code);
      var exitMsg = 'Process ' + _this._proc.pid + ' exited with code ' + code + '\n';
      if (hasError) {
        // PS process failed to start
        _this._print(ERROR_MSG(exitMsg));
        // this._print(ERROR_MSG(Buffer.concat(output.stdout).toString()));
        throw new Error(Buffer.concat(output.stdout).toString().replace(/\0/g, ''));
      } else {
        // dispose
        if (code !== 0) {
          _this._print(ERROR_MSG(exitMsg));
          _this._reject(ERROR_MSG('script exit ' + code));
        } else {
          _this._print(OK_MSG(exitMsg));
          _this._resolve('script exit ' + code);
        }
      }
    });

    output.on('EOI', function (data) {
      if (hasError) {
        _this.emit('err', data);
        _this._print(MSGS.INVOKE.ERROR.CMD_FAIL);
        _this._reject(ERROR_MSG(data));
      } else {
        _this.emit('output', data);
        _this._print(MSGS.INVOKE.OK.CMD_FINISH);
        _this._resolve(data);
      }
      hasError = false;
    });

    // public props
    _this.history = _this._history;
    _this.streams = {
      stdin: _this._proc.stdin,
      stdout: _this._proc.stdout,
      stderr: _this._proc.stderr
    };

    _this._print(OK_MSG('Process ' + _this._proc.pid + ' started\n'));
    return _this;
  }

  _createClass(Shell, [{
    key: '_print',
    value: function _print(msg) {
      this._cfg.verbose && console.log(MODULE_MSG + ' ' + msg);
    }
  }, {
    key: 'addCommand',
    value: function addCommand(command) {
      var _this2 = this;

      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return new Promise(function (resolve, reject) {
        if (!command) {
          return reject(MSGS.ADD_COMMAND.ERROR.CMD_MISS);
        }
        if (!Array.isArray(params)) {
          return reject(MSGS.ADD_COMMAND.ERROR.PARAMS_TYPE);
        }
        var cmdStr = '' + command;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var param = _step.value;

            var paramType = Object.prototype.toString.call(param).slice(8, -1);
            if (paramType === 'Object') {
              var _ret = function () {
                // param is {name: '', value: ''} or {name: value}
                var paramKeys = Object.keys(param);
                var paramName = void 0,
                    paramValue = void 0;
                if (paramKeys.length === 2 && paramKeys[0] === 'name' && paramKeys[1] === 'value') {
                  // param is {name: '', value: ''}
                  paramName = param.name;
                  paramValue = param.value;
                } else if (paramKeys.length === 1 && paramKeys[0]) {
                  // param is {name: value}
                  paramName = paramKeys[0];
                  paramValue = param[paramName];
                } else {
                  return {
                    v: reject(MSGS.ADD_COMMAND.ERROR.PARAM_STRUCT)
                  };
                }
                // cast a parameter value from JS data types to PowerShell data types.
                paramValue = toPS(paramValue);
                // determine whether @ syntax used in cmd
                var isReplaced = false;
                cmdStr = cmdStr.replace('@' + paramName, function (match) {
                  isReplaced = true;
                  return '-' + paramName + ' ' + paramValue;
                });
                if (!isReplaced) {
                  cmdStr = cmdStr.concat(' -' + paramName + (paramValue ? ' ' + paramValue : ''));
                }
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            } else if (paramType === 'String') {
              // param is switch
              cmdStr = cmdStr.concat(' -' + param);
            } else {
              return reject(MSGS.ADD_COMMAND.ERROR.PARAM_TYPE);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        _this2._cmds.push(cmdStr);
        _this2._history.push(cmdStr);
        resolve(_this2._cmds);
      });
    }
  }, {
    key: 'invoke',
    value: function invoke() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        // Make resolve, reject accessible to the class
        _this3._resolve = resolve;
        _this3._reject = reject;

        var cmdsStr = _this3._cmds.join('; ');
        ShellWrite(_this3._proc.stdin, cmdsStr).then(function () {
          return ShellWrite(_this3._proc.stdin, os.EOL);
        }).then(function () {
          return ShellWrite(_this3._proc.stdin, 'echo ' + _this3._cfg.EOI);
        }).then(function () {
          return ShellWrite(_this3._proc.stdin, os.EOL);
        });

        _this3._print(MSGS.INVOKE.OK.CMD_START);
        _this3._print(INFO_MSG(cmdsStr));
        // this._cfg.verbose && console.log(` ${colors.gray(cmdsStr)}`);
        _this3._cmds = [];
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        // Make resolve, reject accessible to the class
        _this4._resolve = resolve;
        _this4._reject = reject;

        ShellWrite(_this4._proc.stdin, 'exit').then(function () {
          return ShellWrite(_this4._proc.stdin, os.EOL);
        }).then(function () {
          return _this4._proc.stdin.end();
        });
      });
    }
  }]);

  return Shell;
}(EventEmitter);
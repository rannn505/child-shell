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
var os = require('os');
var colors = require('chalk');

var MODULE_NAME = exports.MODULE_NAME = 'node-powershell';
// export const EOI         = 'EOI';
var IS_WIN = exports.IS_WIN = os.platform() === 'win32';
var MODULE_MSG = exports.MODULE_MSG = colors.bold.blue('NPS> ');
var INFO_MSG = exports.INFO_MSG = colors.gray;
var OK_MSG = exports.OK_MSG = colors.green;
var ERROR_MSG = exports.ERROR_MSG = colors.red;
var MSGS = exports.MSGS = {
  INIT: {
    OK: {},
    ERROR: {
      START_PS: ERROR_MSG('Opss... ' + MODULE_NAME + ' was unable to start PowerShell.\n\n        Please make sure that PowerShell is installed properly on your system, and try again.')
    }
  },
  ADD_COMMAND: {
    OK: {},
    ERROR: {
      CMD_MISS: ERROR_MSG('Command is missing'),
      PARAMS_TYPE: ERROR_MSG('Params must be an array'),
      PARAM_STRUCT: ERROR_MSG('All params need to be {name: \'\', value: \'\'} or {name: value} structure'),
      PARAM_TYPE: ERROR_MSG('All Params need to be objects or strings')
    }
  },
  INVOKE: {
    OK: {
      CMD_START: OK_MSG('Command invoke started'),
      CMD_FINISH: OK_MSG('Command invoke finished\n')
    },
    ERROR: {
      CMD_FAIL: ERROR_MSG('Command invoke failed\n')
    }
  },
  DISPOSE: {}
};
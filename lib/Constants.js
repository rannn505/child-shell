const os          = require('os');
const colors      = require('chalk');

const MODULE_NAME = 'node-powershell';
const EOI         = 'EOI';
const IS_WIN      = os.platform() === 'win32';
const MODULE_MSG  = colors.bold.blue(`NPS> `);
const INFO_MSG    = colors.gray;
const OK_MSG      = colors.green;
const ERROR_MSG   = colors.red;
const MSGS        = {
  INIT: {
    OK: { },
    ERROR: {
      START_PS: ERROR_MSG(`Opss... ${MODULE_NAME} was unable to start PowerShell.\n
        Please make sure that PowerShell is installed properly on your system, and try again.`),
    }
  },
  ADD_COMMAND: {
    OK: { },
    ERROR: {
      CMD_MISS: ERROR_MSG(`Command is missing`),
      PARAMS_TYPE: ERROR_MSG(`Params must be an array`),
      PARAM_STRUCT: ERROR_MSG(`All params need to be {name: '', value: ''} or {name: value} structure`),
      PARAM_TYPE: ERROR_MSG(`All Params need to be objects or strings`),
    }
  },
  INVOKE: {
    OK: {
      CMD_START: OK_MSG(`Command invoke started`),
      CMD_FINISH: OK_MSG(`Command invoke finished\n`),
    },
    ERROR: {
      CMD_FAIL: ERROR_MSG(`Command invoke failed\n`),
    }
  },
  DISPOSE: { },
};

module.exports = {
  MODULE_NAME,
  EOI,
  IS_WIN,
  MODULE_MSG,
  INFO_MSG,
  OK_MSG,
  ERROR_MSG,
  MSGS,
}
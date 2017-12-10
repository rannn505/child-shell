const os          = require('os');
const colors      = require('chalk');

export const MODULE_NAME = 'node-powershell';
//set this to true for versions of powershell-6.0.0-beta.9 or higher that use pwsh instead of powershell.exe
export const USE_PWSH = false;
// export const EOI         = 'EOI';
export const IS_WIN      = os.platform() === 'win32';
export const MODULE_MSG  = colors.bold.blue(`NPS> `);
export const INFO_MSG    = colors.gray;
export const OK_MSG      = colors.green;
export const ERROR_MSG   = colors.red;
export const MSGS        = {
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

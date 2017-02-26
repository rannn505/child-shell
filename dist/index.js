/*********************************************************
 * node-powershell - Certainly the easiest way to run PowerShell from your NodeJS app
 * @version v3.0.1
 * @link http://rannn505.github.io/node-powershell/
 * @copyright Copyright (c) 2017 Ran Cohen <rannn505@outlook.com>
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @Compiled At: 2017-02-26
  *********************************************************/
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shell = require('./shell');

Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return _shell.Shell;
  }
});
module.exports = exports['default'];
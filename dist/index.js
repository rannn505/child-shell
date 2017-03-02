/*********************************************************
 * node-powershell - Certainly the easiest way to run PowerShell from your NodeJS app
 * @version v3.1.0
 * @link http://rannn505.github.io/node-powershell/
 * @copyright Copyright (c) 2017 Ran Cohen <rannn505@outlook.com>
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @Compiled At: 2017-03-02
  *********************************************************/
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Shell = require('./Shell');

Object.defineProperty(exports, 'default', {
  enumerable: true,
  get: function get() {
    return _Shell.Shell;
  }
});
module.exports = exports['default'];
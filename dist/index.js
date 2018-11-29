/*********************************************************
 * node-powershell - Easily run PowerShell from your NodeJS app
 * @version v3.3.1
 * @link http://hsimah.github.io/node-powershell/
 * @copyright Copyright (c) 2017 Hamish Blake <hamishblake@gmail.com>
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @Compiled At: 2018-8-7
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
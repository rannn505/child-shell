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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var os = require('os');

var _require = require('stream'),
    Writable = _require.Writable;

var Promise = require('bluebird');

var ShellStream = exports.ShellStream = function (_Writable) {
  _inherits(ShellStream, _Writable);

  function ShellStream(EOI, options) {
    _classCallCheck(this, ShellStream);

    var _this = _possibleConstructorReturn(this, (ShellStream.__proto__ || Object.getPrototypeOf(ShellStream)).call(this, options));

    _this.stdout = [];
    _this.EOI = Buffer.from(EOI);
    _this.EOIEOL = Buffer.from('' + EOI + os.EOL);
    return _this;
  }

  _createClass(ShellStream, [{
    key: '_write',
    value: function _write(chunk, encoding, cb) {
      // console.log(`${this.stdout.length} - ${chunk.toString()}`);
      if (this.EOIEOL.compare(chunk) !== 0 && this.EOI.compare(chunk) !== 0) {
        this.stdout.push(chunk);
      } else {
        this.emit('EOI', Buffer.concat(this.stdout).toString());
        this.stdout = [];
      }
      cb();
    }
  }]);

  return ShellStream;
}(Writable);

var ShellWrite = exports.ShellWrite = function ShellWrite(stream, data) {
  return new Promise(function (resolve) {
    if (!stream.write(data)) {
      stream.once('drain', resolve);
    } else {
      process.nextTick(resolve);
    }
  });
};

var toPS = exports.toPS = function toPS(value) {
  switch (Object.prototype.toString.call(value).slice(8, -1)) {
    case 'String':
      return (/\s/.test(value) || value.indexOf('<') !== -1 && value.indexOf('>') !== -1 ? '"' + value + '"' : value
      );
      break;
    case 'Number':
      return value;
      break;
    case 'Array':
      return value;
      break;
    case 'Object':
      return '@' + JSON.stringify(value).replace(/:/g, '=').replace(/,/g, ';');
      break;
    case 'Boolean':
      return value ? '$True' : '$False';
      break;
    case 'Date':
      return value.toLocaleString();
      break;
    case 'Undefined' || 'Null':
      // param is switch
      return value;
      break;
    default:
      return (/\s/.test(value) ? '"' + value + '"' : value
      );
  }
};
const os           = require('os');
const { Writable } = require('stream');
const Promise      = require('bluebird');

class ShellStream extends Writable {
  constructor(EOI, options) {
    super(options);
    this.stdout = [];
    this.EOI = Buffer.from(EOI);
    this.EOIEOL = Buffer.from(`${EOI}${os.EOL}`);
  }
  _write(chunk, encoding, cb) {
    // console.log(`${this.stdout.length} - ${chunk.toString()}`);
    if(this.EOIEOL.compare(chunk) !== 0 && this.EOI.compare(chunk) !== 0) {
      this.stdout.push(chunk);
    } else {
      this.emit('EOI', Buffer.concat(this.stdout).toString());
      this.stdout = [];
    }
    cb();
  }
}

const ShellWrite = (stream, data) => {
  return new Promise(resolve => {
    if (!stream.write(data)) {
      stream.once('drain', resolve);
    } else {
      process.nextTick(resolve);
    }
  });
}

const toPS = (value) => {
  switch (Object.prototype.toString.call(value).slice(8, -1)) {
    case 'String':
      return /\s/.test(value) || (value.indexOf('<') !== -1 && value.indexOf('>') !== -1) ? '"'+value+'"' : value;
      break;
    case 'Number':
      return value;
      break;
    case 'Array':
      return value;
      break;
    case 'Object':
      return `@${JSON.stringify(value).replace(/:/g, '=').replace(/,/g, ';')}`;
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
      return /\s/.test(value) ? '"'+value+'"' : value;
  }
}

module.exports = {
  ShellStream,
  ShellWrite,
  toPS,
}
const { getType, convertToPSParam }= require('./utils');
const {
  PS_ARG_MISS_ERROR,
  PS_ARG_TYPE_ERROR,
} = require('./errors');

class PSCommand {
  constructor(command) {
    if(!command) {
      throw new PS_ARG_MISS_ERROR('Command is missing');
    }
    if(getType(command) !== 'String') {
      throw new PS_ARG_TYPE_ERROR('Command must be a string');
    }

    this.command = command;
  }
  addArgument(argument = '') {
    if(!argument) {
      throw new PS_ARG_MISS_ERROR('Argument is missing');
    }
    if(getType(argument) !== 'String') {
      throw new PS_ARG_TYPE_ERROR('Argument must be a string');
    }

    this.command = `${this.command} ${argument}`;
    return this;
  }
  addParameter(parameter = {}) {
    if(!parameter) {
      throw new PS_ARG_MISS_ERROR('Parameter is missing');
    }
    if(getType(parameter) !== 'Object') {
      throw new PS_ARG_TYPE_ERROR('Parameter must be an object');
    }

    // calc param structure
    const paramKeys = Object.keys(parameter);
    let paramKey;
    let paramValue;
    if(paramKeys.length === 1) {
      // param is {name: value}
      [paramKey] = paramKeys;
      paramValue = parameter[paramKey];
    } else if(paramKeys.length === 2 && paramKeys[0] === 'name' && paramKeys[1] === 'value') {
      // param is {name: '', value: ''}
      paramKey = parameter.name;
      paramValue = parameter.value;
    } else {
      throw new PS_ARG_TYPE_ERROR('All params must be in either {name: value} or {name: "", value: ""} structure');
    }

    // cast a parameter value from JS data types to PowerShell data types.
    paramValue = convertToPSParam(paramValue);
    paramValue = paramValue ? ` ${paramValue}` : '';

    this.command = `${this.command} -${paramKey}${paramValue}`;
    return this;
  }
  clone() {
    return new PSCommand(this.command);
  }
  clear() {
    this.command = '';
    return this;
  }
}

module.exports = PSCommand;
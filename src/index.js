/**
 * Created by Ran Cohen on 20/07/2015.
 */

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var spawn        = require("child_process").spawn;
var colors       = require('chalk');
var promise      = require('bluebird');

const MODULE_NAME = 'node-powershell';
const ERROR_COLOR = colors.bold.red;

/**
 * The PS Shell class.
 * @param {string} cmdlets - the commends/script`s path to run.
 * @param {object} opt - options fot the shell
 * @returns {Shell}
 * @constructor
 */
class Shell extends EventEmitter {
    constructor(cmdlets, {executionPolicy: executionPolicy = 'Unrestricted', outputEncoding: outputEncoding = 'utf8', debugMsg: debugMsg = true} = {}){
        super();
        this.cmdlets = cmdlets;
        this.opt = {};
        this.opt.executionPolicy = executionPolicy; this.opt.outputEncoding = outputEncoding; this.opt.debugMsg = debugMsg;
    }
    execute(){
        var _shell = this;

        let _args = ['-ExecutionPolicy', this.opt.executionPolicy,
                     '-Command'        , `& ${this.cmdlets}`]
        let _proc = spawn("powershell.exe", _args, {stdio: ['ignore', 'pipe', 'pipe' ]});

        _proc.stdout.setEncoding(this.opt.outputEncoding);
        _proc.stderr.setEncoding(this.opt.outputEncoding);

        (this.opt.debugMsg) && console.log(colors.blue(`<${MODULE_NAME}>:: `) + colors.green(`Process ${_proc.pid} started\n`));

        return new Promise((resolve, reject)=>{
            var output = "";

            _proc.stdout.on('data', data=>{
                _shell.emit('output', data);
                output += data;
            });
            _proc.stderr.on('data', data=>{
                _shell.emit('output', data);
            });
            _proc.on('error', error=>{
                _shell.emit('error', error);
                reject(error);
            });
            _proc.on('close', code=>{
                (this.opt.debugMsg) && console.log(colors.blue(`<${MODULE_NAME}>:: `) + colors.green(`Process ${_proc.pid} exited with code ${code}\n`));

                setTimeout(function () {
                     _shell.emit('end', code);

                     (code == 1) && reject('script exit 1');
                     resolve({code: code, output: output.trim()})
                }, 10);
            });
        });
    }
    static executionStringBuilder(path, params=[]){
        return new Promise((resolve, reject)=>{
            (typeof path === 'undefined' || !path) && reject('script exit 1');
            var str = path;
            params.forEach(param=>{
               str = str.concat(` -${param.name} "${param.value}"`)
            });
            resolve(str);
        });
   }
}

/**
 * The ShellManager class.
 * @returns {ShellManager}
 * @constructor
 */
class ShellManager {
    constructor({maxParallel: maxParallel = 4} = {}){
        this.shellsQueue = [];
        this.opt = {};
        this.opt.maxParallel = maxParallel;
    }
    queue(shell){
        if(shell instanceof Shell) {
            this.shellsQueue.push(shell);
        }
        else {
            throw new TypeError('param is not instanceof Shell');
        }
    }
    execute(){
        return promise.map(this.shellsQueue, shell=>{
            return shell.execute();
        }, {concurrency: this.opt.maxParallel});
    }
}

module.exports = {
    Shell       : Shell,
    ShellManager: ShellManager
};
export default Shell;

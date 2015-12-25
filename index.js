/**
 * Created by Ran Cohen on 20/07/2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var spawn = require("child_process").spawn;
var colors = require("colors");

const MODULE_NAME = 'node-powershell';

/**
 * The PS Shell class.
 * @param {string} cmdlets - the commends/script`s path to run.
 * @param {object} opt - options fot the shell
 * @returns {Shell}
 * @constructor
 */
function Shell (cmdlets, opt){

    var _run = cmdlets;
    var _shell = this;

    opt = (typeof opt == 'undefined') ? {} : opt;
    opt.debugMsg = (typeof opt.debugMsg == 'undefined') ? true : opt.debugMsg;

    var _proc = spawn("powershell.exe",
        ["-command", util.format("& {%s}",_run)],
        {stdio: ['ignore', 'pipe', 'pipe' ]});

    _proc.stdout.setEncoding('utf8');
    _proc.stderr.setEncoding('utf8');

    if(opt.debugMsg){
        util.log(
            colors.blue(util.format('<%s> ', MODULE_NAME)) +
            colors.green(util.format('Starting %s on %s\n', _proc.pid , process.platform)))
    }


    _proc.stdout.on("data",function(data){
        _shell.emit('output', data);
    });
    _proc.stderr.on("data",function(data) {
        _shell.emit('output', data);
    });

    _proc.on('close', function (code) {

        if(opt.debugMsg) {
            util.log(
                colors.blue(util.format('<%s> ', MODULE_NAME)) +
                colors.green(util.format('Process %s exited with code %s', _proc.pid, code)));
        }

        _shell.emit('end', code);
    });

    return _shell;
}

util.inherits(Shell, EventEmitter);
module.exports = Shell;

/**
 * Created by Ran Cohen on 20/07/2015.
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var spawn = require("child_process").spawn,proc;
var colors = require("colors");

const MODULE_NAME = 'node-powershell';

function Shell (obj){

    var run = obj;
    var shell = this;

    proc = spawn("powershell.exe",["-command", "&"+run+""]);

    proc.stdin.setEncoding('utf8');
    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    console.log(colors.green('Runing ' + proc.pid + ' on ' + process.platform));

    proc.on('close', function (code) {
        proc.stdin.end();
        console.log(colors.green('child process ' + proc.pid  + ' exited with code ' + code));
        shell.emit('end', code);
    });


    shell.output = function(cb){
        proc.stdout.on("data",function(data){
           cb(data);
        });

        proc.stderr.on("data",function(data) {
            cb(data);
        });
    };

    shell.input = function(data){

        proc.stdin.write(data,'utf8',function(){
            //console.log('Data Received');
            proc.stdin.end();
        });
    };

    return shell;
}

util.inherits(Shell, EventEmitter);
module.exports = Shell;

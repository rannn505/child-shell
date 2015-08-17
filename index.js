/**
 * Created by Ran Cohen on 20/07/2015.
 */

var spawn = require("child_process").spawn,proc;
var colors = require("colors");

const MODULE_NAME = 'node-powershell';

function ps (obj){

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

module.exports = ps;
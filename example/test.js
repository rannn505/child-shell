/**
 * Created by Ran Cohen on 20/07/2015.
 */

var shell = require('../index');

/*Test Cmdlet*/
var PS1 = new shell('echo "node-powershell is awesome"', {debugMsg: false});
PS1.on('output', function(data){
    console.log(data);
});
PS1.on('end', function(code) {

    /*Test Script*/
    var PS2 = new shell('C:/Users/RAN/Desktop/node-powershell/example/script.ps1 "node-powershell Rocks"');
    PS2.on('output', function(data) {
        console.log(data);
    });
});

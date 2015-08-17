/**
 * Created by Ran Cohen on 20/07/2015.
 */

var ps = require('../index');

var shell_1 = ps('echo "node-powershell is awesome"');

shell_1.output(function(data){
    console.log(data);
});


var shell_2 = ps("'C:/Users/Ran Cohen/Desktop/node-powershell/example/script.ps1'");

shell_2.input("node-powershell Rocks");

shell_2.output(function(data){
    console.log(data);
});

var shell        = require('../index').Shell;
var ShellManager = require('../index').ShellManager;

/* Promise Method */
var params =  [{name:'str', value:'node-powershell Rocks'}];
shell.executionStringBuilder("D:/Projects/open_source/node-powershell/example/script.ps1", params)
    .then(function(str){
        var ps = new shell(str, {executionPolicy: 'Bypass', debugMsg: false});
        return ps.execute();
    })
    .then(function(output){
        console.log(output);
    })
    .catch(function(err){
        console.log(err);
    });

/* Events Method */
var ps1 = new shell("D:/Projects/open_source/node-powershell/example/script.ps1 'node-powershell Awesome'");
ps1.execute();
ps1.on('output', function(data){
    console.log(data);
});
ps1.on('end', function(code) {
    console.log(code);
});

/* ShellManager Method */
var sm = new ShellManager({maxParallel: 2});
sm.queue(ps1);
sm.queue(ps1);
sm.queue(new shell("D:/Projects/open_source/node-powershell/example/script.ps1 'node-powershell Sooo Cool'"));
sm.execute()
    .then(function(output){
        console.log(output);
    });

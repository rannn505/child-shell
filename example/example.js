var shell = require('../dist/index');

var ps = new shell({executionPolicy: 'Bypass', debugMsg: true});

ps.addCommand('$a = "node-"');
ps.addCommand('$a += "powershell "');
ps.addCommand('$a += "is awesome"; $a')
  .then(function(){
    return ps.invoke();
  })
  .then(function(output){
    console.log(output);
    var params = [{name:'str', value:'node-powershell rocks'}];
    ps.addCommand('./script-input.ps1', params);
    return ps.invoke();
  })
  .then(function(output){
    console.log(output);
    ps.addCommand('./script-loop.ps1');
    return ps.invoke();
  })
  .then(function(output){
    console.log(output);
    console.log(ps.history);
    ps.dispose();
  })
  .catch(function(err){
    console.log(err);
    ps.dispose();
  });

// ps.addCommand('echo node-powershell')
// ps.invoke()
// .then(output => {
//   console.log(output);
//   ps.dispose();
// })
// .catch(err => {
//   console.log(err);
//   ps.dispose();
// });

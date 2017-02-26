var shell = require('../dist/index');

var ps = new shell({executionPolicy: 'Bypass', debugMsg: true});

ps.addCommand('./script-input.ps1', [{str: 'node-powershell is the best'}])
  .then(function(output){
    console.log(output);
    return ps.invoke();
  })
  .then(function(output){
    console.log(output);
    ps.addCommand('./script-dataTypes.ps1', [
      {string: 'abc'},
      {char: 'a'},
      {byte: '0x26'},
      {int: 1},
      {long: 10000000000},
      {bool: '$True'},
      {decimal: '1d'},
      // single
      {double: 1.1},
      {DateTime: new Date().toLocaleString()},
      {xml: '"<a></a>"'},
      {array: [1,2]},
      // {hashtable: [{A:1},{B:2}]},
      {switch: true}
    ]);
    return ps.invoke();
  })
  .then(function(output){
    console.log(output);
    ps.dispose();
  })
  .catch(function(err){
    console.log('ERROR');
    console.log(err);
    ps.dispose();
  });

var Shell = require('../lib/index');

const ps = new Shell({executionPolicy: 'Bypass', verbose: true, 3: true});

ps.addCommand('Write-host')
  .then(() => ps.addArgument('yay'))
  .then(() => ps.addParameters([
    { ForegroundColor: 'red' },
    { BackgroundColor: 'black'}
  ]))
  .then(() => ps.addCommand('Write-Error'))
  .then(() => ps.addArgument('boo'))
  .then(() => ps.addParameters([
    { ForegroundColor: 'red' },
    { BackgroundColor: 'black'}
  ]))
  // .then(() => ps.invoke())
  // .then(console.log)
  // .catch(console.log)
  // .finally(ps.dispose);
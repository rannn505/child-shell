<img height="64" width="64" src="https://raw.githubusercontent.com/rannn505/node-powershell/master/assets/node-powershell3-1-0.png"> Node-PowerShell
===

<a href="https://travis-ci.org/rannn505/node-powershell"><img src="https://img.shields.io/travis/rannn505/node-powershell.svg?style=flat-square" alt="Build Status"></a>
<a href="https://www.npmjs.com/package/node-powershell"><img src="https://img.shields.io/npm/v/node-powershell.svg?style=flat-square" alt="NPM Version"></a>
<a href="https://npm-stat.com/charts.html?package=node-powershell"><img src="https://img.shields.io/npm/dt/node-powershell.svg?style=flat-square" alt="NPM Downloads"></a>
<a href="https://coveralls.io/github/rannn505/node-powershell"><img src="https://img.shields.io/coveralls/rannn505/node-powershell.svg?style=flat-square" alt="Coveralls"></a>
<a href="http://packagequality.com/#?package=node-powershell"><img src="http://npm.packagequality.com/shield/node-powershell.svg?style=flat-square" alt="Package Quality"></a>
<a href="https://github.com/rannn505/node-powershell/issues?q=is%3Aissue+is%3Aclosed"><img src="https://img.shields.io/github/issues-closed-raw/rannn505/node-powershell.svg?style=flat-square" alt="Closed Issues"></a>
<a href="https://david-dm.org/rannn505/node-powershell"><img src="https://img.shields.io/david/rannn505/node-powershell.svg?style=flat-square" alt="Dependencies"></a>
<a href="https://github.com/rannn505/node-powershell/blob/master/LICENSE"><img src="https://img.shields.io/github/license/rannn505/node-powershell.svg?style=flat-square" alt="License"></a>
<a href="https://github.com/rannn505/node-powershell/stargazers"><img src="https://img.shields.io/github/stars/rannn505/node-powershell.svg?style=social&label=Star" alt=" GitHub Stars"></a>

>  Node-PowerShell taking advantage of two of the simplest, effective and easy tools that exist in the today technology world.
On the one hand, <a href="https://nodejs.org/en/">NodeJS</a> which made a revolution in the world of javascript,
and on the other hand, <a href="https://github.com/PowerShell/PowerShell">PowerShell</a> which recently came out with an initial open-source, cross-platform version,
and by connecting them together, gives you the power to create any solution you were asked to, no matter if you are a programmer, an IT or a DevOps guy.

## Installation
```bash
$ npm i -S node-powershell
$ yarn add node-powershell
```

## Quick start
```javascript
const shell = require('node-powershell');

let ps = new shell({
  executionPolicy: 'Bypass',
  noProfile: true
});

ps.addCommand('echo node-powershell')
ps.invoke()
.then(output => {
  console.log(output);
})
.catch(err => {
  console.log(err);
  ps.dispose();
});
```


## API Reference
**:memo: [API reference](http://cdn.rawgit.com/rannn505/node-powershell/236b6c3a/docs/docs.html)**<br/>
I've created a convenient and readable page, so you can enjoy the experience of learning and begin to use the module quickly and easily.


## :fire: PowerShell 6.0
As you may have heard already, lately Microsoft is taking steps towards becoming an open source company.
One of these steps, brings us [PowerShell 6.0][] , which is a cross-platform version of the amazing tool that we know and love from Windows.
Node-PowerShell Welcomes the move, and started the current version, will fully support the new PS.
Moreover, I will continue to follow the development of the new PS repo, and to update the module accordingly. Enjoy!
[PowerShell 6.0]: https://github.com/PowerShell/PowerShell


## License

  [MIT](LICENSE) © [Ran Cohen](https://github.com/rannn505)

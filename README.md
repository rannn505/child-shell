Node-PowerShell
===

<div>
<p> <img height="50" width="50" src="https://raw.githubusercontent.com/rannn505/node-powershell/master/assets/node-powershell.png"> Lightweight module to run PowerShell straight from your Node app </p>
</div>

[![Version npm](https://img.shields.io/npm/v/node-powershell.svg?style=flat-square)](https://www.npmjs.com/package/node-powershell)[![NPM Downloads](https://img.shields.io/npm/dt/node-powershell.svg?style=flat-square)](https://www.npmjs.com/package/node-powershell)[![Dependencies](https://img.shields.io/david/rannn505/node-powershell.svg?style=flat-square)](https://david-dm.org/rannn505/node-powershell)


## Installation

```bash
$ npm install node-powershell
```

## Quick start

```javascript
var shell = require('node-powershell');

PS = new shell('echo "node-powershell is awesome"');

PS.on('output', function(data){
    console.log(data);
});
PS.on('end', function(code) {
    //optional callback
    //Do Something
});
```

## Examples

####  Running a `.ps1` script:

```js
PS = new shell("Path/To/Your/Script.ps1");
```

####  Putting an input to yor script:

Just use `param ( )` instead of `Read-Host` in your script:
```PowerShell
param (
    [Parameter(Mandatory = $true)]
    [string]$st
)
echo $st
```

and `'path "args"'` in your node app:
```javascript
PS = new shell('Path/To/Your/Script.ps1 "node-powershell Rocks"');
```

#### Disabling Debug Messages:

use `{debugMsg: false}` option: (Default is true)
```javascript
PS = new shell('echo "node-powershell is awesome"', {debugMsg: false});
```


## License

  [MIT](LICENSE)


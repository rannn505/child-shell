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
var ps = require('node-powershell');

Shell = ps("echo node-powershell is awesome");

Shell.output(function(data){
    console.log(data);
});
```

## Examples

####  Running a `.ps1` script:

```js
Shell = ps("'Path/To/Your/Script.ps1'");
```
Don't forget the `"' '"` around the path

####  Putting an input to yor script:

Just use `[Console]::In.ReadLine()` instead of `Read-Host` in your script:
```PowerShell
$t = [Console]::In.ReadLine();
echo $t
```

and `.input` property in your node app:
```javascript
powershell.input("node-powershell Rocks");
```

## License

  [MIT](LICENSE)



Node-PowerShell
===

<div align="center">
<p> <img height="70" width="70" src="https://raw.githubusercontent.com/rannn505/node-powershell/master/assets/node-powershell.png"> Lightweight module to run PowerShell straight from your Node app </p>

<a href="http://badge.fury.io/js/node-powershell">
<img src="https://badge.fury.io/js/node-powershell.svg" alt="npm version" height="18"></a>

<a href="https://david-dm.org/rannn505/node-powershell">
<img src="https://david-dm.org/rannn505/node-powershell.svg" alt="npm version" height="18"></a>

<a href="https://david-dm.org/rannn505/node-powershell">
<img src="http://img.shields.io/npm/dm/node-powershell.svg" alt="npm version" height="18"></a>

<br><br>
<a href="https://nodei.co/npm/node-powershell/"><img src="https://nodei.co/npm/node-powershell.png?downloads=true&downloadRank=true&stars=true"></a>
</div>

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

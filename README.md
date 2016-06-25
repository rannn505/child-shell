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
var shell = require('node-powershell').Shell;

var params = [{name:'paramName', value:'paramValue'}];
shell.executionStringBuilder("Path/To/Your/Script.ps1", params)
    .then(function(str){
        var ps = new shell(str);
        return ps.execute();
    })
    .then(function(output){
        console.log(output);
    })
    .catch(function(err){
        console.log(err);
    });
```

## API

### Shell Class `require('node-powershell').Shell`
#### Initiating:
Creates a new shell instance.
```javascript
var ps = new shell(ps1ScriptPath / psCommand, options);
```
options:
- **debugMsg** - Determines whether to log verbose to the console (Boolean) (Default: true) *optional*
- **outputEncoding** - Sets the output encoding for the current shell (String) (Default: 'utf8') *optional*
- **executionPolicy** - Sets the default execution policy for the current shell session (String) (Default: 'Unrestricted') *optional*

#### shellInstance.execute:
Starts executing the ps1ScriptPath / psCommand of the shell. return a promise with the output.
```javascript
ps.execute()
    .then(function(output){
        console.log(output);
    })
    .catch(function(err){
        console.log(err);
    });
```
#### (static) Shell.executionStringBuilder:
Helper method that return a promise with an "Always works" Execution String.
```javascript
var paramsArray =  [{name:'paramName', value:'paramValue'}];
shell.executionStringBuilder(ps1ScriptPath, paramsArray)
    .then(function(str){
        console.log(str);
    });
```

### ShellManager Class `require('node-powershell').ShellManager`
***Use this class when you want to execute lots of shells at once, and get their outputs together.***
#### Initiating:
Creates a new shell instance.
```javascript
var sm = new ShellManager(options);
```
options:
- **maxParallel** - Determines the number of shells that can run in parallel (Number) (Default: 4) *optional*

#### ShellManagerInstance.queue:
Queue the shell for later execution.
```javascript
sm.queue(new shell());
```
#### ShellManagerInstance.execute:
Starts executing all of the queued shells. return a promise with the output.
```javascript
sm.execute()
    .then(function(output){
        console.log(output);
    })
    .catch(function(err){
        console.log(err);
    });
```


## Examples

####  Use the Shell events:
```javascript
var shell = require('node-powershell').Shell;

var ps = new shell('echo "node-powershell is awesome"');
ps.on('output', function(data){
    console.log(data);
});
ps.on('end', function(code) {
    //Do Something else
});
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
and `Shell.executionStringBuilder()` or `'path "args"'` in your node app.


***for more examples please look at the [example page](https://github.com/rannn505/node-powershell/blob/master/example/example.js).***


## License

  [MIT](LICENSE)

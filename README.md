<img height="64" width="64" src="https://raw.githubusercontent.com/rannn505/node-powershell/master/assets/node-powershell3-1-0.png"> Node-PowerShell
===

[![Version npm](https://img.shields.io/npm/v/node-powershell.svg?style=flat-square)](https://www.npmjs.com/package/node-powershell)[![NPM Downloads](https://img.shields.io/npm/dt/node-powershell.svg?style=flat-square)](https://www.npmjs.com/package/node-powershell)[![Dependencies](https://img.shields.io/david/rannn505/node-powershell.svg?style=flat-square)](https://david-dm.org/rannn505/node-powershell)

>  Lightweight module to run PowerShell straight from your Node app.

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

ps.addCommand('echo "node-powershell rocks"')
ps.invoke()
  .then(output=> {
    console.log(output);
    ps.dispose();
  })
  .catch(err=> {
    console.log(err);
    ps.dispose();
  });
```


## API

### PowerShell Class `require('node-powershell')`
Provides promise based methods that are used to create a pipeline of commands and invoke those commands within a PowerShell runspace.

#### initialize(constructor):
Creates a new shell instance.
```javascript
var ps = new shell(options);
```
options:
- **debugMsg** - Determines whether to log verbose to the console (Boolean) (Default: true) *optional*
- **inputEncoding** - Sets the input encoding for the current shell (String) (Default: 'utf8') *optional*
- **outputEncoding** - Sets the output encoding for the current shell (String) (Default: 'utf8') *optional*
- **executionPolicy** - Sets the default execution policy for the current shell session (String) (Default: 'Unrestricted') *optional*
- **noProfile** - Determines whether to load the Windows PS profile (Boolean) (Default: true) *optional*

#### Properties:
| Name    | Description                                                             |
|---------|-------------------------------------------------------------------------|
| history | An array containing the command history ever added to the shell.        |
| streams | An object containing the sdtio (in,out,err) of the PowerShell Instance. |

#### Methods:
| Name                             | Description                                                                              | Syntax                                                                         | Return Value                                                    |
|----------------------------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------|
| addCommand(command, params = []) | Adds a command to the end of the pipeline of the shell object.                           | ps.addCommand('./script.ps1',  [{name:'str', value:'node-powershell rocks'}]); | A promise of the commands.                                      |
| invoke()                         | Runs the commands of the shell object pipeline.                                          | ps.invoke();                                                                   | A promise with the result  (can also be rejected to the catch). |
| dispose()                        | Releases all resources used by the shell object and closes the PowerShell child_process. | ps.dispose();                                                                  | A promise of the exit code.                                     |

#### Events:
| Name   | Description                     | Syntax                     |
|--------|---------------------------------|----------------------------|
| output | Emits when shell has an output. | ps.on('output', data=>{}); |
| err    | Emits when shell has an error.  | ps.on('err', error=>{});   |
| end    | Emits when shell ends.          | ps.on('end', code=>{});    |


## Examples

####  Putting an input to yor script:
Just use `param ( )` instead of `Read-Host` in your script:
```PowerShell
param (
    [Parameter(Mandatory = $true)]
    [string]$str
)
echo $str
```
and `Shell.addCommand() with the params array` in your node app.

***for more examples please look at the [example page](https://github.com/rannn505/node-powershell/blob/master/example/example.js).***


## :fire::fire::fire: PowerShell 6.0 :fire::fire::fire:
As you may have heard already, lately Microsoft is taking steps towards becoming an open source company.
One of these steps, brings us [PowerShell 6.0][] , which is a cross-platform version of the amazing tool that we know and love from Windows.
Node-PowerShell Welcomes the move, and started the current version, will fully support the new PS.
Moreover, I will continue to follow the development of the new PS repo, and to update the module accordingly. Enjoy!
[PowerShell 6.0]: https://github.com/PowerShell/PowerShell


## License

  [MIT](LICENSE)

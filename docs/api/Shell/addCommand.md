# addCommand(command, [params])

Adds a command to the end of the pipeline of the shell object.

#### Arguments

* **command** - A PowerShell command or a path to a PowerShell script `[String] _required_`
* **params [DEPRECATED]** - A Set of parameters to be added to the command. `[Array/String] (Default: []) _optional_`
  * {name: '', value: ''}
  * {name: value}
  * 'switch'

> addCommand() with the @param syntax is no longer supported. please use ES6 string templates instead.

#### Returns

[Promise] - A promise that resolves with the array of commands currently in the pipeline, or rejects with an error.    

#### Example

```javascript
ps.addCommand('Write-Host node-powershell', [
  {name: 'foregroundcolor', value: 'red'},
  {name: 'nonewline', value: null} //switch
]).then(cmdsArr => {}).catch(err => {});

ps.addCommand('Write-Host node-powershell', [
  {foregroundcolor: 'red'},
  {nonewline: null} //switch
]);

// NO LONGER SUPPORTED
ps.addCommand('Write-Host node-powershell @foregroundcolor', [
  {foregroundcolor: 'red'},
  'nonewline' //switch
]);

// script-syntax: https://ss64.com/ps/syntax-run.html
ps.addCommand('./script.ps1', params);
ps.addCommand(`& "${require('path').resolve(__dirname, 'script.ps1')}"`, params);
```
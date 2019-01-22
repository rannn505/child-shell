# addArgument(argument)

Adds an argument to the last added command.

#### Arguments

* **argument** - A PowerShell command or a path to a PowerShell script `[String] _required_`

#### Returns

<!-- [Promise] - A promise that resolves with the array of commands currently in the pipeline, or rejects with an error.     -->

#### Example

<!-- ```javascript
ps.addCommand('Write-Host node-powershell', [
  {name: 'foregroundcolor', value: 'red'},
  {name: 'nonewline', value: null} //switch
]).then(cmdsArr => {}).catch(err => {});

ps.addCommand('Write-Host node-powershell', [
  {foregroundcolor: 'red'},
  {nonewline: null} //switch
]);

ps.addCommand('Write-Host node-powershell @foregroundcolor', [
  {foregroundcolor: 'red'},
  'nonewline' //switch
]);

// script-syntax: https://ss64.com/ps/syntax-run.html
ps.addCommand('./script.ps1', params);
ps.addCommand(`& "${require('path').resolve(__dirname, 'script.ps1')}"`, params);
``` -->
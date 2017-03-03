Shell [Class]
------
Provides [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) based methods that are used to create a pipeline of commands and invoke those commands within a PowerShell runspace.

### Importing
#### ES6
```js
import shell from 'node-powershell'
```
#### ES5 (CommonJS)
```js
const shell = require('node-powershell')
```

### Initialize [Constructor]
Creates a new Shell instance.
```javascript
let ps = new shell(options);
```
#### options:
- **debugMsg** - Determines whether to log verbose to the console [Boolean] (Default: true) *optional*
- **inputEncoding** - Sets the input encoding for the current shell [String] (Default: 'utf8') *optional*
- **outputEncoding** - Sets the output encoding for the current shell [String] (Default: 'utf8') *optional*
- **executionPolicy** - Sets the default execution policy for the current shell session [String] (Default: 'Unrestricted') *optional*
- **noProfile** - Determines whether to load the Windows PS profile [Boolean] (Default: true) *optional*

### Methods
#### addCommand(command, params = []) [promise]
Adds a command to the end of the pipeline of the shell object.

- **command** [String] *required*
  - PowerShell command
  - PowerShell script
- **params** [Array/String] *optional*
  - {name: '', value: ''}
  - {name: value}
  - 'switch'

```js
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
```

#### invoke() [promise]
Runs the commands of the shell object pipeline.

```js
ps.invoke().then(output => {}).catch(err => {});
```

#### dispose() [promise]
Releases all resources used by the shell object and closes the PowerShell child_process.

```js
ps.dispose().then(code => {}).catch(err => {});
```

### Properties
#### history [Array]
An array containing the command history ever added to the shell instance.
```js
console.log(ps.history);
```

#### streams [Object]
An object containing the [sdtio (in,out,err)](https://nodejs.org/api/child_process.html#child_process_child_stderr) [[stream.Readable]](https://nodejs.org/api/stream.html#stream_class_stream_readable) of the PowerShell Instance.
```js
ps.streams.stdin.write();
ps.streams.stdout.on('data', data=>{});
```

### Events
#### output
Emits when shell has an output.
```js
ps.on('output', data => {});
```

#### err
Emits when shell has an error.
```js
ps.on('err', err => {});
```

#### end
Emits when shell ends.
```js
ps.on('end', code => {});
```

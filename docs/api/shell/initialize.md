# Initialize [Constructor]

Creates a new Shell instance.

### options:

* **debugMsg** - Determines whether to log verbose to the console. `[Boolean] (Default: true) _optional_`
* **inputEncoding** - Sets the input encoding for the current shell. `[String] (Default: 'utf8') _optional_`
* **outputEncoding** - Sets the output encoding for the current shell. `[String] (Default: 'utf8') _optional_`
* **executionPolicy** - Sets the default execution policy for the current shell session. `[String] (Default: 'Unrestricted') _optional_`
* **noProfile** - Determines whether to load the Windows PS profile. `[Boolean] (Default: true) _optional_`

#### Returns

[Shell] - An object that provides [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) based methods that are used to create a pipeline of commands and invoke those commands within a PowerShell runspace.

#### Example

```javascript
import Shell from 'node-powershell'
let ps = new Shell({
  debugMsg: true,
  executionPolicy: 'RemoteSigned'
});
```



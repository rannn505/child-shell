Tips
------
### script input
Use `param ( )` instead of `Read-Host` in your script.
```PowerShell
param (
    [Parameter(Mandatory = $true)]
    [string]$str
)
$str
```
and `addCommand()` with params array in your node app.

### parse output
Use [PSObject](https://devopscollective.gitbooks.io/the-big-book-of-powershell-gotchas/content/manuscript/new-object_psobject_vs_pscustomobject.html) to represent the output of your commands,
then pipe it to `| ConvertTo-Json -Compress` command.
```PowerShell
$obj = [PSCustomObject]@{name="obj"; value="output"}
$obj | ConvertTo-Json -Compress
```
now you can use `JSON.parse()` to parse the output to a JS object.

### use pipeline
Use `addCommand()` with the `@param` syntax.
```javascript
ps.addCommand('Get-Process @ComputerName | where {$_.ProcessName -eq "powershell"}', [
  {ComputerName: 'localhost'}
]);
```

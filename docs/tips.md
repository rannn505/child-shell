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

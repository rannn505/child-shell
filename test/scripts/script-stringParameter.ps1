param(
    [string]$baseline,
    [string]$singleQuote,
    [string]$doubleQuote,
    [string]$mixedQuote,
    [string]$withSpace,
    [string]$withComma
)

$tests = @(
    [PSCustomObject]@{name="baseline"; value=$baseline; test=$baseline -eq "quickbrownfox"},
    [PSCustomObject]@{name="singleQuote"; value=$singleQuote; test=$singleQuote -eq "`'quick`'brownfox"},
    [PSCustomObject]@{name="doubleQuote"; value=$doubleQuote; test=$doubleQuote -eq "`"quick`"brownfox"},
    [PSCustomObject]@{name="mixedQuote"; value=$mixedQuote; test=$mixedQuote -eq "`"quick`"brown`'fox`'"},
    [PSCustomObject]@{name="withSpace"; value=$withSpace; test=$withSpace -eq "`"quick`" brown `'fox`'"}
    [PSCustomObject]@{name="withComma"; value=$withComma; test=$withComma -eq 'quick,brown,fox'}
)

$tests | ConvertTo-Json -Compress
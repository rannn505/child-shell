param (
  $string,
  [char] $char,
  [byte] $byte,
  $int,
  $long,
  [bool] $bool,
  $decimal,
  $single,
  $double,
  [DateTime] $DateTime,
  [xml] $xml,
  [array] $array,
  [hashtable]$hashtable,
  $switch
)

echo PRINT
$string
$char
$byte
$int
$long
$bool
$decimal
$single
$double
$DateTime
$xml
$array
$hashtable
$switch

echo TEST
$string -is [string]
$char -is [char]
$byte -is [byte]
$int -is [int]
$long -is [long]
$bool -is [bool]
$decimal -is [decimal]
#$single -is [single]
$double -is [double]
$DateTime -is [DateTime]
$xml -is [xml]
$array -is [array] -and $array.length -gt 1
$hashtable -is [hashtable]
$switch -eq $true

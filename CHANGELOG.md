# Change Log

## [v3.3.0](https://github.com/rannn505/node-powershell/tree/v3.3.0) - 2017-10-28
**Implemented enhancements:**
- Add support to PowerShell Hashtable data type - {name: JSON} -> [hashtable]$hashtable.
- New way to detect output - Unique ShellStream class created.
- Add optional parameter to determine the PS version.
- Add optional parameter to change EOI string.
- Improve performance.

**Fixed bugs:**
- Added shell option to change EOI string. [\#18](https://github.com/rannn505/node-powershell/pull/18)
- Fix EOL Bug. [\#34](https://github.com/rannn505/node-powershell/pull/34)
- Intermittently the data from the power shell instance is blank. [\#20](https://github.com/rannn505/node-powershell/issues/20)
- Escaping string input. [\#21](https://github.com/rannn505/node-powershell/issues/21)
- addCommand("ls c:") followed by invoke() always emits nothing (blank string). [\#25](https://github.com/rannn505/node-powershell/issues/25)
- "EOI" marker matching logic often "eats" last chunk of output. [\#26](https://github.com/rannn505/node-powershell/issues/26)
- NO output from powershell when an argument value changes. [\#31](https://github.com/rannn505/node-powershell/issues/31)
- new-webserviceproxy isn't supported. [\#32](https://github.com/rannn505/node-powershell/issues/32)
- 'end' event not fired, outputs merged. [\#33](https://github.com/rannn505/node-powershell/issues/33)


## [v3.1.0](https://github.com/rannn505/node-powershell/tree/v3.1.0) - 2017-02-25
**Implemented enhancements:**
- Add support to most of PowerShell data types including switch options ({name: ''}).
- New syntax to send parameters to addCommand method. {name: value}
- New homepage and docs.
- Add headers to build files.
- Integration with travis-ci.

**Fixed bugs:**
- Unable to send [switch] options. [\#17](https://github.com/rannn505/node-powershell/issues/17)
- Unable to send array of strings. [\#15](https://github.com/rannn505/node-powershell/issues/15)

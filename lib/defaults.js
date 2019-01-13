module.exports = {
  nps: {
    usePwsh: false,
    debugMsg: true,
    verbose: true,

    inputEncoding: 'utf8',
    outputEncoding: 'utf8',
  },
  
  pwsh: {
    // https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_pwsh?view=powershell-6

    executionPolicy: (arg) => {
      if(!arg) {
        return ['-ExecutionPolicy', 'Bypass'];
      }
      
      if(!['Restricted', 'AllSigned', 'RemoteSigned', 'Unrestricted', 'Bypass', 'Undefined'].includes(arg)) {
        return [];
      }

      return ['-ExecutionPolicy', arg];
    },
    configurationName: '',
    settingsFile: '',
    workingDirectory: '',
    
    // noExit: true,
    // noLogo: true,
    nonInteractive: true,
    noProfile: true,
    
    inputFormat: 'Text', // Text | XML
    outputFormat: 'Text', // Text | XML

    WindowStyle: 'Normal', //  Normal, Minimized, Maximized, and Hidden.,
  },
  powershell: { 
    // https://docs.microsoft.com/en-us/powershell/scripting/core-powershell/console/powershell.exe-command-line-help?view=powershell-6

    executionPolicy: 'Bypass', // Restricted, AllSigned, RemoteSigned, Unrestricted, Bypass, Undefined
    version: '', // determine version - "2.0", "3.0"
    psConsoleFile: '',
    mta: false,
    sta: true,
    
    // noExit: true,
    // noLogo: true,
    nonInteractive: true,
    noProfile: true,

    inputFormat: 'Text', // Text | XML
    outputFormat: 'Text', // Text | XML

    WindowStyle: 'Normal'
  } 
}



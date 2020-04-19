import { PowerShell, PSCommand } from '../dist/index';

export default (async (): Promise<void> => {
  try {
    const ps = new PowerShell({
      // processOptions: {
      //   executionPolicy: 'Bypass',
      //   noProfile: true,
      //   noLogo: true,
      // },
    });

    const cmd1 = new PSCommand()
      .addCommand('$a = "node-"')
      .addStatement()
      .addCommand('$a += "powershell "')
      .addStatement()
      .addCommand('$a += "is awesome"')
      .addStatement()
      .addCommand('echo')
      .addArgument('$a');
    const res1 = await ps.addCommand(cmd1).invoke();
    console.log(res1);

    const cmd2 = new PSCommand().addCommand('Get-Process').addCommand('fl').addArgument('id');
    const res2 = await ps.addCommand(cmd2).invoke();
    console.log(res2);

    const cmd3 = new PSCommand('throw').addArgument('err');
    const res3 = await ps.addCommand(cmd3).invoke();
    console.log(res3);

    await ps.kill();
  } catch (error) {
    console.log(error);
  }
})();

/* eslint-disable no-console */

import { NodePowerShell, PSCommand } from '../dist/index';

(async (): Promise<void> => {
  try {
    const ps = new NodePowerShell({
      processOptions: {
        shit: true,
      },
    });

    const cmd1 = new PSCommand()
      .addCommand('$a = "node-"')
      .addStatement()
      .addCommand('$a += "powershell "')
      .addStatement()
      .addCommand('$a += "is awesome"')
      .addStatement()
      .addCommand('$a');
    const res1 = await ps.addCommand(cmd1).invoke();
    console.log(res1);

    const cmd2 = new PSCommand().addCommand('Get-Process').addCommand('fl').addArgument('id');
    const res2 = await ps.addCommand(cmd2).invoke();
    console.log(res2);

    const cmd3 = new PSCommand('throw').addArgument('err');
    const res3 = await ps.addCommand(cmd3).invoke();
    console.log(res3);

    ps.dispose();
  } catch (error) {
    console.log(error);
  }
})();

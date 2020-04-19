const { PowerShell, PSCommand } = require('../dist/index');

(async () => {
  try {
    const ps = new PowerShell({
      processOptions: {
        shit: true,
      },
    });

    // const cmd1 = new PSCommand()
    //   .addCommand('$a = "node-"')
    //   .addStatement()
    //   .addCommand('$a += "powershell "')
    //   .addStatement()
    //   .addCommand('$a += "is awesome"')
    //   .addStatement()
    //   .addCommand('$a');

    // ps.addCommand("echo 'rani'").invoke()
    await ps.addCommand("echo 'ran'").invoke();

    // const res1 = await ps.addCommand('exit 0').invoke();
    // console.log(res1);
    // const cmd2 = new PSCommand().addCommand('Get-Process').addCommand('fl').addArgument('id');
    // const res2 = await ps.addCommand(cmd2).invoke();
    // console.log(res2);

    // const cmd3 = new PSCommand('throw').addArgument('err');
    // const res3 = await ps.addCommand(cmd3).invoke();
    // console.log(res3);

    // await ps.addCommand("exit 77").invoke();
    await ps.kill();
    console.log("bla");
  } catch (error) {
    console.log(error);
  }
})();

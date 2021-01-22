/* eslint-disable @typescript-eslint/no-var-requires */
const { PowerShell } = require('../packages/node-powershell');

const test = async () => {
  const ps = new PowerShell({ debug: true });

  for (let index = 0; index < 10; index += 1) {
    /* eslint-disable no-await-in-loop */
    const res = await ps.addCommand(`echo ${index}`).invoke();
    console.log('im index and res: %n %s', index, res);
  }

  await ps.kill();
};
test();

// (async () => {
//   try {
//     const ps = new PowerShell({
//       processOptions: {
//         shit: true,
//       },
//     });

//     // const cmd1 = new PSCommand()
//     //   .addCommand('$a = "node-"')
//     //   .addStatement()
//     //   .addCommand('$a += "powershell "')
//     //   .addStatement()
//     //   .addCommand('$a += "is awesome"')
//     //   .addStatement()
//     //   .addCommand('$a');

//     // ps.addCommand("echo 'rani'").invoke()
//     await ps.addCommand("echo 'ran'").invoke();

//     // const res1 = await ps.addCommand('exit 0').invoke();
//     // console.log(res1);
//     // const cmd2 = new PSCommand().addCommand('Get-Process').addCommand('fl').addArgument('id');
//     // const res2 = await ps.addCommand(cmd2).invoke();
//     // console.log(res2);

//     // const cmd3 = new PSCommand('throw').addArgument('err');
//     // const res3 = await ps.addCommand(cmd3).invoke();
//     // console.log(res3);

//     // await ps.addCommand("exit 77").invoke();
//     await ps.kill();
//     console.log("bla");
//   } catch (error) {
//     console.log(error);
//   }
// })();

import { Bash } from '../packages/node-bash/lib/index';
import { PowerShell } from '../packages/node-powershell/lib/index';

const bashInstance = async () => {
  const sh = new Bash({
    debug: true,
    executableOptions: {
      '--noprofile': true,
    },
  });

  const sh2 = new Bash({
    debug: true,
    invocationTimeout: 1000,
    disposeTimeout: 3000,
    throwOnInvocationError: false,
  });

  try {
    await sh.invoke('pwd');
    await sh2.invoke('sleep 2s');

    const message = 'hey from node-bash <3';
    const echoCommand = Bash.command`echo ${message}`;
    await sh.invoke(echoCommand);

    const messageArray = message.split(' ');
    const echoArrayCommand = Bash.command`echo ${messageArray}`;
    await sh.invoke(echoArrayCommand);

    await sh.invoke('cat ./script.sh');
    await sh.invoke('. ./script.sh');
    const scriptCommand = Bash.command`. ./script.sh --message ${message}`;
    const result = await sh.invoke(scriptCommand);
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    await sh.dispose();
  }
};

const powershellInstance = async () => {
  const ps = new PowerShell({
    debug: true,
    executableOptions: {
      '-ExecutionPolicy': 'Bypass',
      '-NoProfile': true,
    },
  });

  try {
    const message = 'hey from node-powershell <3';
    const printCommand = PowerShell.command`Write-Host ${message} -ForegroundColor red -BackgroundColor white`;
    await ps.invoke(printCommand);

    const scriptCommand = PowerShell.command`. ./script.ps1 -message ${message}`;
    const result = await ps.invoke(scriptCommand);
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    await ps.dispose();
  }
};

(async () => {
  console.log('========== playground ==========');
  await bashInstance();
  await powershellInstance();

  console.log(await Bash.$`echo playground`);
  console.log(
    await PowerShell.$`echo ${[
      { id: 1, name: 'ran' },
      { id: 2, name: 'cohen' },
    ]}`,
  );

  const message = 'child-shell is awesome';
  await Bash.$$`echo ${message}`({ debug: true });
  await PowerShell.$$`echo ${message}`({ debug: true });

  console.log('========== playground ==========');
})();

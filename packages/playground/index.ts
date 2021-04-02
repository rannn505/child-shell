import { Bash, sh$, $ } from 'node-bash';
import { PowerShell, ps$ } from 'node-powershell';

(async () => {
  console.log('========== playground start ==========');

  const sh = new Bash({
    debug: true,
    disposeTimeout: 5000,
    executableOptions: {
      '--noprofile': true,
    },
  });
  const ps = new PowerShell({
    debug: true,
    throwOnInvocationError: false,
    executableOptions: {
      '-ExecutionPolicy': 'Bypass',
      '-NoProfile': true,
    },
  });
  let result;

  try {
    const echo = ['node', '+', 'powershell', '=', '<3'];
    await ps.invoke(PowerShell.command`echo ${echo}`);
    result = await ps$`echo ${echo}`; // [NOTE] debug disabled (by default)
    await PowerShell.invoke(PowerShell.command`echo ${echo}`, { debug: true });

    let message = 'hey from node-bash <3';
    await sh.invoke('. ./script.sh');
    await $`. ./script.sh`; // [NOTE] debug disabled
    await sh$`. ./script.sh --message ${message}`; // [NOTE] debug disabled
    await Bash.invoke(Bash.command`. ./script.sh --message ${message}`, { debug: true });

    message = 'hey from node-powershell <3';
    await ps.invoke(PowerShell.command`. ./script.ps1 -message ${message}`);
  } catch (error) {
    console.error(error);
  } finally {
    // await sh.dispose(); // [NOTE] disposeTimeout enabled
    await ps.dispose();

    console.log(result);
    console.log('========== playground end ==========');
  }
})();

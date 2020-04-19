import { PowerShell } from '../dist/index';

export default (async (): Promise<void> => {
  const ps = new PowerShell();

  const res1 = await ps.addCommand('./examples/4.script-input.ps1')
    .addParameters([{ name: 'str', value: 'node-powershell rocks' }])
    .invoke();
  console.log(res1);

  await ps.kill();
})();

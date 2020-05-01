/* eslint-disable no-console */
import { PowerShell } from 'node-powershell';

export default (async (): Promise<void> => {
  const ps = new PowerShell();

  const res1 = await ps
    .addScript('./examples/4.script-input.ps1')
    .addParameters([{ dash: '-', name: 'str', value: 'node-powershell rocks' }])
    .invoke();
  console.log(res1);

  await ps.kill();
})();

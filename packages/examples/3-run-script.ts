/* eslint-disable no-console */
import { PowerShell } from 'node-powershell';

export default (async (): Promise<void> => {
  const ps = new PowerShell();

  const res1 = await ps.addScript('./examples/3.script-loop.ps1').invoke();
  console.log(res1);

  await ps.kill();
})();

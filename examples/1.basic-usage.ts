/* eslint-disable no-console */
import { PowerShell } from 'node-powershell';

export default (async (): Promise<void> => {
  const ps = new PowerShell();

  const res1 = await ps.addCommand('pwd').invoke();
  console.log(res1);

  await ps.kill();
})();

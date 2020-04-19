import { PowerShell } from '../dist/index';

export default (async (): Promise<void> => {
  const ps = new PowerShell();

  const res1 = await ps.addCommand('./examples/3.script-loop.ps1').invoke();
  console.log(res1);

  await ps.kill();
})();

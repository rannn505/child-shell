/* eslint-disable no-console */

import { NodePowerShell } from '../dist/index';

(async (): Promise<void> => {
  const ps = new NodePowerShell();

  const res1 = await ps.addCommand('pwd').invoke();
  console.log(res1);

  ps.dispose();
})();

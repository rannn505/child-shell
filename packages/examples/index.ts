import { Bash } from 'node-bash';
import { PowerShell } from 'node-powershell';

import ex1 from './1-basic-usage';
import ex2 from './2-longer-basic-usage';
import ex3 from './3-run-script';
import ex4 from './4-run-script-with-params';

const debug = async (shell) => {
  for (let index = 0; index < 10; index += 1) {
    /* eslint-disable no-await-in-loop */
    const res = await shell.addCommand(`echo ${index}`).invoke();
    console.log('im index and res: %n %s', index, res);
  }

  await shell.addCommand('exit 0').invoke();
};

debug(new Bash({ debug: true }));
debug(new PowerShell({ debug: true }));

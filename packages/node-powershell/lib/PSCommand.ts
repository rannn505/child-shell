import { Command } from 'child-shell';
import { PSTypeConverter } from './PSTypeConverter';

export class PSCommand extends Command {
  constructor();
  constructor(line?: string);
  constructor(line = '') {
    super(line, new PSTypeConverter());
  }
}

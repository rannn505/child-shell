import { Command } from 'child-shell';
import { SHTypeConverter } from './SHTypeConverter';

export class SHCommand extends Command {
  constructor();
  constructor(line?: string);
  constructor(line = '') {
    super(line, new SHTypeConverter());
  }
}

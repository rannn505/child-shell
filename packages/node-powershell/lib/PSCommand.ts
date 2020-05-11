import { Command } from '@nbsh/core';
import { PSArgument } from './PSArgument';
import { PSParameter } from './PSParameter';

export class PSCommand extends Command {
  constructor();
  constructor(line = '', ArgumentCtor = PSArgument, ParameterCtor = PSParameter) {
    super(line, ArgumentCtor, ParameterCtor);
  }
}

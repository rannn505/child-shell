import { ShellParameter } from '../shell/ShellParameter';
import { PSObject, PSUndefined, PSTypeConverter } from './PSTypes';

export class PSParameter extends ShellParameter {
  constructor(name: string, value?: unknown) {
    const psValue = value instanceof PSObject ? value : PSTypeConverter.convertToPSObject(value);
    super(name, psValue);
  }

  protected setDash(): void {
    this.dash = '-';
  }

  protected isSwitch(): boolean {
    return this.value instanceof PSUndefined;
  }
}

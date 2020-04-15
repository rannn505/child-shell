import { ShellArgument } from '../shell/ShellArgument';
import { PSObject, PSTypeConverter } from './PSTypes';

export class PSArgument extends ShellArgument {
  constructor(object: unknown) {
    const psArgument = object instanceof PSObject ? object : PSTypeConverter.convertToPSObject(object);
    super(psArgument);
  }
}

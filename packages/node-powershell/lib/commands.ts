import { PSCommand } from './PSCommand';

export const getVersion = new PSCommand('$PSVersionTable.PSEdition + " " + $PSVersionTable.PSVersion');

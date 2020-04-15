import { ShellCommand } from '../shell/ShellCommand';
import { PSArgument } from './PSArgument';
import { PSParameter } from './PSParameter';

export class PSCommand extends ShellCommand<PSCommand> {
  protected setPipelineChar(): void {
    this.pipeline = '|';
  }

  protected setStatementChar(): void {
    this.statement = ';';
  }

  protected setShellCommandConstructor(): void {
    this.ShellCommandConstructor = PSCommand;
  }

  protected setShellArgumentConstructor(): void {
    this.ShellArgumentConstructor = PSArgument;
  }

  protected setShellParameterConstructor(): void {
    this.ShellParameterConstructor = PSParameter;
  }
}

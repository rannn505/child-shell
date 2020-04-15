export type Dash = '-' | '--';

export interface IShellParameterConstructor {
  new (name: string, value?: unknown): ShellParameter;
}

export abstract class ShellParameter {
  readonly name: string;
  readonly value: unknown;
  protected dash: Dash;

  constructor(name: string, value?: unknown) {
    this.name = name;
    this.value = value;
    this.setDash();
  }

  protected abstract setDash(): void;
  protected abstract isSwitch(): boolean;

  toString(): string {
    if (this.isSwitch()) {
      return `${this.dash}${this.name}`;
    }
    return `${this.dash}${this.name} ${this.value.toString()}`;
  }
}

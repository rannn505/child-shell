export type Converter<S, D> = (this: TypeConverter<S, D>, object: unknown) => D;

export type Converters<S, D> = Map<S, Converter<S, D>>;

export abstract class TypeConverter<S, D> {
  private readonly converters: Converters<S, D>;

  protected abstract getType(object: unknown): S;

  constructor(converters: Converters<S, D> = new Map()) {
    this.converters = converters;
  }

  public convert(object: unknown): D {
    const objectType = this.getType(object);
    const hasConverter = this.converters.has(objectType);
    if (!hasConverter) {
      throw new Error(`There is no converter to a ${objectType} object`);
    }
    return this.converters.get(objectType).call(this, object);
  }
}

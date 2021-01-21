import { JavaScriptTypeConverter, JavaScriptConverter } from 'child-shell';

export class PSTypeConverter extends JavaScriptTypeConverter {
  constructor() {
    const convertNull: JavaScriptConverter = function () {
      return '$Null';
    };

    const convertBoolean: JavaScriptConverter = function (object) {
      return (object as boolean) ? '$True' : '$False';
    };

    const convertObject: JavaScriptConverter = function (object) {
      return `@${JSON.stringify(object).replace(/:/g, '=').replace(/,/g, ';')}`;
    };

    const convertDate: JavaScriptConverter = function (object) {
      return (object as Date).toLocaleString();
    };

    super(
      new Map([
        ['null', convertNull],
        ['boolean', convertBoolean],
        ['object', convertObject],
        ['date', convertDate],
      ]),
    );
  }
}

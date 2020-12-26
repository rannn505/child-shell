import { EOL } from 'os';
import { trimBufferStart, trimBufferEnd, trimBuffer } from '../lib';

describe('trim-buffer', () => {
  const TRIMMABLE = 'trimmable';
  const examples = [
    `${EOL}${TRIMMABLE}`,
    ` ${TRIMMABLE}`,

    `${TRIMMABLE}${EOL}`,
    `${TRIMMABLE} `,

    `${EOL}${TRIMMABLE}${EOL}`,
    ` ${TRIMMABLE} `,

    `${EOL}${EOL}${TRIMMABLE}${EOL}${EOL}`,
    `  ${TRIMMABLE}  `,

    `${EOL}${EOL}${EOL}${EOL}${EOL}${TRIMMABLE}${EOL}`,
    `     ${TRIMMABLE} `,

    `${EOL} ${TRIMMABLE}${EOL} `,
    ` ${EOL}${TRIMMABLE} ${EOL}`,
    `     ${EOL}${TRIMMABLE}    ${EOL} ${EOL} `,
    ` ${EOL}  ${EOL}${TRIMMABLE}${EOL}`,
    `${EOL}${TRIMMABLE} `,
  ];

  test.each(examples)('trimBufferStart', (trimmable: string) => {
    const buf = Buffer.from(trimmable);
    const trimmed = trimBufferStart(buf);
    const expected = Buffer.from(trimmable.trimLeft());
    expect(Buffer.compare(trimmed, expected)).toBe(0);
  });

  test.each(examples)('trimBufferEnd', (trimmable: string) => {
    const buf = Buffer.from(trimmable);
    const trimmed = trimBufferEnd(buf);
    const expected = Buffer.from(trimmable.trimRight());
    expect(Buffer.compare(trimmed, expected)).toBe(0);
  });

  test.each(examples)('trimBuffer', (trimmable: string) => {
    const buf = Buffer.from(trimmable);
    const trimmed = trimBuffer(buf);
    const expected = Buffer.from(trimmable.trim());
    expect(Buffer.compare(trimmed, expected)).toBe(0);
  });
});

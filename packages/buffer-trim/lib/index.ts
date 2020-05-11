import { EOL } from 'os';

const eol = EOL.charCodeAt(0);
const space = ' '.charCodeAt(0);
export const isWhitespaceByte = (byte: number): boolean => byte === eol || byte === space;

export const trimBufferStart = (buf: Buffer): Buffer => {
  let start = 0;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= buf.length; i++) {
    if (!isWhitespaceByte(buf[i])) {
      start = i;
      break;
    }
  }

  return buf.slice(start);
};

export const trimBufferEnd = (buf: Buffer): Buffer => {
  let end = buf.length;

  // eslint-disable-next-line no-plusplus
  for (let i = buf.length - 1; i >= 0; i--) {
    if (!isWhitespaceByte(buf[i])) {
      end = i;
      break;
    }
  }

  return buf.slice(0, end + 1);
};

export const trimBuffer = (buf: Buffer): Buffer => {
  return trimBufferStart(trimBufferEnd(buf));
};

/* eslint-disable no-plusplus */

const bn = '\n'.charCodeAt(0);
const br = '\r'.charCodeAt(0);
const space = ' '.charCodeAt(0);
export const isWhitespaceByte = (byte: number): boolean => byte === bn || byte === br || byte === space;

export const trimBufferStart = (buf: Buffer): Buffer => {
  let start = 0;
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

import { EOL } from 'os';

export const trimBuffer = (buf: Buffer): Buffer => {
  const eol = EOL.charCodeAt(0);

  let start = 0;
  let end = buf.length;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= buf.length; i++) {
    if (buf[i] !== eol) {
      start = i;
      break;
    }
  }

  // eslint-disable-next-line no-plusplus
  for (let i = buf.length - 1; i >= 0; i--) {
    if (buf[i] !== eol) {
      end = i;
      break;
    }
  }

  return buf.slice(start, end + 1);
};

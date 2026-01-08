// Minimal ANSI styling (no deps). Works in Windows Terminal + most modern consoles.
export const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  inverse: "\x1b[7m",

  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
};

export function colorize(s: string, ...codes: string[]) {
  return `${codes.join("")}${s}${ansi.reset}`;
}

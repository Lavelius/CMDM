import * as readline from "node:readline";

export type IO = {
  rl: readline.Interface;
  println: (s?: string) => void;
  prompt: (q: string) => Promise<string>;
  close: () => void;
};

export function createIO(): IO {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    rl,
    println: (s = "") => console.log(s),
    prompt: (q: string) =>
      new Promise((resolve) => rl.question(q, (ans) => resolve(ans))),
    close: () => rl.close(),
  };
}

export function clearScreen() {
  // works in most terminals
  process.stdout.write("\x1Bc");
}

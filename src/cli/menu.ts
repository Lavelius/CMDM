import { IO, clearScreen } from "./io";

export type MainRoute =
  | { kind: "exit" }
  | { kind: "initiative" }
  | { kind: "campaignSelect" };

export async function mainMenu(io: IO): Promise<MainRoute> {
  while (true) {
    clearScreen();
    io.println("CMDM — Command-Line Dungeon Master");
    io.println("");
    io.println("1) Initiative Tracker");
    io.println("2) Campaign Select (soon)");
    io.println("3) Settings (soon)");
    io.println("0) Exit");
    io.println("");

    const choice = (await io.prompt("> ")).trim();

    if (choice === "1") return { kind: "initiative" };
    if (choice === "2") return { kind: "campaignSelect" };
    if (choice === "3") {
      io.println("\nSettings not implemented yet.");
      await io.prompt("Press Enter...");
      continue;
    }
    if (choice === "0") return { kind: "exit" };

    io.println("\nInvalid choice.");
    await io.prompt("Press Enter...");
  }
}

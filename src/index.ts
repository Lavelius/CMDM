import { createIO } from "./cli/io";
import { mainMenu } from "./cli/menu";
import { runInitiative } from "./features/initiative/ui";

async function main() {
  const io = createIO();

  try {
    while (true) {
      const route = await mainMenu(io);

      if (route.kind === "exit") break;

      if (route.kind === "initiative") {
        await runInitiative(io);
        continue;
      }

      if (route.kind === "campaignSelect") {
        io.println("\nCampaign select not implemented yet.");
        await io.prompt("Press Enter...");
        continue;
      }
    }
  } finally {
    io.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

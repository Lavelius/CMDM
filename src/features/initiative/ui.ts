import { IO, clearScreen } from "../../cli/io";
import { InitiativeState } from "./types";
import * as Engine from "./engine";
import { ansi, colorize } from "../../cli/style";

function line(io: IO, s = "") {
  io.println(s);
}

function render(state: InitiativeState, io: IO) {
  clearScreen();
  line(io, `Initiative — ${state.encounter.name}`);
  line(io, `Round: ${state.round}   Started: ${state.started ? "Yes" : "No"}`);

  const byId = new Map(state.encounter.combatants.map((c) => [c.id, c]));
  const activeId = state.order[state.activeIndex];
  const active = activeId ? byId.get(activeId) : undefined;

  line(io, "");
  if (state.started && active) {
    line(io, `ACTIVE TURN: ${active.name}  (Init ${active.initiativeTotal})`);
    line(io, "----------------------------------------");
  } else {
    line(io, "ACTIVE TURN: (not started)");
    line(io, "----------------------------------------");
  }

  if (state.order.length > 0) {
    line(io, "Turn Order:");
    state.order.forEach((id, idx) => {
      const c = byId.get(id);
      if (!c) return;

        const isActive = state.started && idx === state.activeIndex;
        const marker = isActive ? colorize("▶▶", ansi.bold, ansi.yellow) : "  ";
        const factionColor = c.faction === "party" ? ansi.green : ansi.red;

        const text = `${marker} ${idx + 1}. ${c.name}  Init ${c.initiativeTotal} (${c.initiativeRoll ?? "—"} + ${c.initiativeMod})  HP ${c.hpCurrent}/${c.hpMax}`;
        const colored = colorize(text, factionColor);
        line(io, isActive ? colorize(colored, ansi.inverse, ansi.bold) : colored);

    });
  } else {
    line(io, "Turn Order: (roll initiative to generate)");
  }

  line(io, "");
  line(io, "Commands:");
  line(io, "  a  = add combatant");
  line(io, "  r  = roll initiative");
  line(io, "  s  = start combat");
  line(io, "  n  = next turn");
  line(io, "  p  = previous turn");
  line(io, "  hp = adjust hp (active combatant)");
  line(io, "  d  = delete combatant");
  line(io, "  e  = end combat (clears order)");
  line(io, "  q  = back to main menu");
  line(io, "  sp = save PARTY roster");
  line(io, "  se = save ENEMY roster");
  line(io, "  lp = load PARTY roster into encounter");
  line(io, "  le = load ENEMY roster into encounter");
  line(io, "  lr = list saved rosters");
  line(io, "  encsave = save entire encounter");
  line(io, "  encload = load entire encounter (replaces current)");
  line(io, "  lenc = list saved encounters");
  line(io, "");
}

import * as Persist from "./persistence";

export async function runInitiative(io: IO) {
  
  let state = Engine.createInitialState("Encounter");

  while (true) {
    render(state, io);
    const cmd = (await io.prompt("> ")).trim().toLowerCase();

    if (cmd === "q") return;

    if (cmd === "a") {
      const name = (await io.prompt("Name: ")).trim();
      if (!name) continue;
      const mod = Number((await io.prompt("Init mod (number): ")).trim() || "0");
      const hpMax = Number((await io.prompt("HP max (number): ")).trim() || "10");
      const factionRaw = (await io.prompt("Faction (p=party, e=enemy) [e]: ")).trim().toLowerCase();
      const faction = factionRaw === "p" || factionRaw === "party" ? "party" : "enemy";

      state = Engine.addCombatant(state, { name, faction, initiativeMod: mod, hpMax });

      
      continue;
    }

    if (cmd === "r") {
      state = Engine.rollInitiative(state, "auto");
      continue;
    }

    if (cmd === "s") {
      state = Engine.startCombat(state);
      continue;
    }

    if (cmd === "n") {
      state = Engine.nextTurn(state);
      continue;
    }

    if (cmd === "p") {
      state = Engine.prevTurn(state);
      continue;
    }

    if (cmd === "e") {
      state = Engine.endCombat(state);
      continue;
    }

    if (cmd === "hp") {
      if (state.order.length === 0) continue;
      const byId = new Map(state.encounter.combatants.map((c) => [c.id, c]));
      const activeId = state.order[state.activeIndex];
      const active = byId.get(activeId);
      if (!active) continue;

      const delta = Number((await io.prompt(`HP delta for ${active.name} (e.g. -7, +3): `)).trim() || "0");
      state = Engine.adjustHp(state, active.id, delta);
      continue;
    }

    if (cmd === "d") {
      const name = (await io.prompt("Delete who? (type name contains): ")).trim().toLowerCase();
      if (!name) continue;
      const target = state.encounter.combatants.find((c) => c.name.toLowerCase().includes(name));
      if (!target) continue;
      state = Engine.removeCombatant(state, target.id);
      continue;
    }
    if (cmd === "sp") {
  const name = (await io.prompt("Roster name (party): ")).trim();
  if (!name) continue;
  await Persist.saveRoster(state, name, "party");
  io.println("\nSaved party roster.");
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "se") {
  const name = (await io.prompt("Roster name (enemy): ")).trim();
  if (!name) continue;
  await Persist.saveRoster(state, name, "enemy");
  io.println("\nSaved enemy roster.");
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "lr") {
  const files = await Persist.listRosters();
  io.println("\nSaved rosters:");
  files.forEach((f) => io.println(`- ${f}`));
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "lp") {
  const name = (await io.prompt("Load which party roster?: ")).trim();
  if (!name) continue;
  const roster = await Persist.loadRoster(name, "party");
  if (!roster) {
    io.println("\nNot found.");
    await io.prompt("Press Enter...");
    continue;
  }
  state = Engine.importCombatants(state, roster.combatants);
  io.println("\nLoaded party roster into encounter.");
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "le") {
  const name = (await io.prompt("Load which enemy roster?: ")).trim();
  if (!name) continue;
  const roster = await Persist.loadRoster(name, "enemy");
  if (!roster) {
    io.println("\nNot found.");
    await io.prompt("Press Enter...");
    continue;
  }
  state = Engine.importCombatants(state, roster.combatants);
  io.println("\nLoaded enemy roster into encounter.");
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "encsave") {
  const name = (await io.prompt("Encounter save name: ")).trim();
  if (!name) continue;
  await Persist.saveEncounter(state, name);
  io.println("\nSaved encounter.");
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "lenc") {
  const files = await Persist.listEncounters();
  io.println("\nSaved encounters:");
  files.forEach((f) => io.println(`- ${f}`));
  await io.prompt("Press Enter...");
  continue;
}

if (cmd === "encload") {
  const name = (await io.prompt("Load encounter name: ")).trim();
  if (!name) continue;
  const enc = await Persist.loadEncounter(name);
  if (!enc) {
    io.println("\nNot found.");
    await io.prompt("Press Enter...");
    continue;
  }

  // Replace current encounter cleanly:
  state = Engine.createInitialState(enc.name);
  state = Engine.importCombatants(state, enc.combatants);

  io.println("\nLoaded encounter.");
  await io.prompt("Press Enter...");
  continue;
}


    // unknown
    io.println("\nUnknown command.");
    await io.prompt("Press Enter...");
  }
}

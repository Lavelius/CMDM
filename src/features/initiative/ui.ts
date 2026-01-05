import { IO, clearScreen } from "../../cli/io";
import { InitiativeState } from "./types";
import * as Engine from "./engine";

function line(io: IO, s = "") {
  io.println(s);
}

function render(state: InitiativeState, io: IO) {
  clearScreen();
  line(io, `Initiative — ${state.encounter.name}`);
  line(io, `Round: ${state.round}   Started: ${state.started ? "Yes" : "No"}`);
  line(io, "");

  const byId = new Map(state.encounter.combatants.map((c) => [c.id, c]));
  if (state.order.length > 0) {
    line(io, "Turn Order:");
    state.order.forEach((id, idx) => {
      const c = byId.get(id);
      if (!c) return;
      const active = state.started && idx === state.activeIndex ? " ▶" : "  ";
      line(
        io,
        `${active} ${idx + 1}. ${c.name}  Init ${c.initiativeTotal} (${c.initiativeRoll ?? "—"} + ${c.initiativeMod})  HP ${c.hpCurrent}/${c.hpMax}`
      );
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
  line(io, "  hp = adjust hp");
  line(io, "  d  = delete combatant");
  line(io, "  e  = end combat (clears order)");
  line(io, "  q  = back to main menu");
  line(io, "");
}

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
      state = Engine.addCombatant(state, { name, initiativeMod: mod, hpMax });
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

    // unknown
    io.println("\nUnknown command.");
    await io.prompt("Press Enter...");
  }
}

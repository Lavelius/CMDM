import { writeJson, readJson, listFiles } from "../../cli/storage";
import { Combatant, Faction, InitiativeState } from "./types";

type SavedCombatant = Omit<Combatant, "id" | "initiativeRoll" | "initiativeTotal"> & {
  // keep id out so new encounters don’t collide
};

type RosterFile = {
  name: string;
  faction: Faction;
  combatants: SavedCombatant[];
};

type EncounterFile = {
  name: string;
  partyRoster?: string;
  enemyRoster?: string;
  combatants: SavedCombatant[];
};

function stripForSave(c: Combatant): SavedCombatant {
  return {
    name: c.name,
    kind: c.kind,
    faction: c.faction,
    initiativeMod: c.initiativeMod,
    hpCurrent: c.hpCurrent,
    hpMax: c.hpMax,
  };
}

export async function saveRoster(state: InitiativeState, rosterName: string, faction: Faction) {
  const combatants = state.encounter.combatants
    .filter((c) => c.faction === faction)
    .map(stripForSave);

  const payload: RosterFile = { name: rosterName, faction, combatants };
  await writeJson(`roster.${faction}.${rosterName}.json`, payload);
}

export async function loadRoster(rosterName: string, faction: Faction): Promise<RosterFile | null> {
  return await readJson<RosterFile>(`roster.${faction}.${rosterName}.json`);
}

export async function listRosters(): Promise<string[]> {
  const files = await listFiles();
  return files.filter((f) => f.startsWith("roster.") && f.endsWith(".json"));
}

export async function saveEncounter(state: InitiativeState, name: string, partyRoster?: string, enemyRoster?: string) {
  const combatants = state.encounter.combatants.map(stripForSave);
  const payload: EncounterFile = { name, partyRoster, enemyRoster, combatants };
  await writeJson(`encounter.${name}.json`, payload);
}

export async function loadEncounter(name: string): Promise<EncounterFile | null> {
  return await readJson<EncounterFile>(`encounter.${name}.json`);
}

export async function listEncounters(): Promise<string[]> {
  const files = await listFiles();
  return files.filter((f) => f.startsWith("encounter.") && f.endsWith(".json"));
}

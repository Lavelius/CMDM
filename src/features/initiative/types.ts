export type Id = string;

export type CombatantKind = "pc" | "npc" | "monster";

export type Encounter = {
  id: Id;
  name: string;
  combatants: Combatant[];
};

export type InitiativeState = {
  encounter: Encounter;
  order: Id[];
  activeIndex: number;
  round: number;
  started: boolean;
};

export type Faction = "party" | "enemy";

export type Combatant = {
  id: Id;
  name: string;
  kind: CombatantKind;
  faction: Faction; // <-- add this

  initiativeMod: number;
  initiativeRoll: number | null;
  initiativeTotal: number;

  hpCurrent: number;
  hpMax: number;
};

export type Id = string;

export type CombatantKind = "pc" | "npc" | "monster";

export type Combatant = {
  id: Id;
  name: string;
  kind: CombatantKind;

  initiativeMod: number;
  initiativeRoll: number | null;
  initiativeTotal: number;

  hpCurrent: number;
  hpMax: number;
};

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

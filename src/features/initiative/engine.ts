import { Combatant, Encounter, Id, InitiativeState } from "./types";

const uid = () => crypto.randomUUID();

export function newEncounter(name = "Encounter"): Encounter {
  return { id: uid(), name, combatants: [] };
}

export function createInitialState(encounterName?: string): InitiativeState {
  const encounter = newEncounter(encounterName ?? "Encounter");
  return { encounter, order: [], activeIndex: 0, round: 1, started: false };
}

export function addCombatant(
  state: InitiativeState,
  input: { name: string; kind?: Combatant["kind"]; faction?: Combatant["faction"]; initiativeMod?: number; hpMax?: number }
): InitiativeState {
  const mod = input.initiativeMod ?? 0;
  const hpMax = input.hpMax ?? 10;

  const c: Combatant = {
    id: uid(),
    name: input.name,
    kind: input.kind ?? "npc",
    initiativeMod: mod,
    initiativeRoll: null,
    initiativeTotal: mod, // until rolled
    hpCurrent: hpMax,
    hpMax,
    faction: input.faction ?? "enemy",

    
  };

  return {
    ...state,
    encounter: { ...state.encounter, combatants: [...state.encounter.combatants, c] },
  };
}

function sortByInitiative(combatants: Combatant[]) {
  return [...combatants].sort((a, b) => {
    if (b.initiativeTotal !== a.initiativeTotal) return b.initiativeTotal - a.initiativeTotal;
    if (b.initiativeMod !== a.initiativeMod) return b.initiativeMod - a.initiativeMod;
    return a.name.localeCompare(b.name);
  });
}

export function rollInitiative(state: InitiativeState, mode: "auto" | "keep" = "auto"): InitiativeState {
  const combatants = state.encounter.combatants.map((c) => {
    const shouldRoll = mode === "auto" || c.initiativeRoll == null;
    if (!shouldRoll) return { ...c, initiativeTotal: (c.initiativeRoll ?? 0) + c.initiativeMod };

    const roll = Math.floor(Math.random() * 20) + 1;
    return { ...c, initiativeRoll: roll, initiativeTotal: roll + c.initiativeMod };
  });

  const order = sortByInitiative(combatants).map((c) => c.id);

  return {
    ...state,
    encounter: { ...state.encounter, combatants },
    order,
    activeIndex: 0,
    round: 1,
  };
}

export function startCombat(state: InitiativeState): InitiativeState {
  if (state.order.length === 0) return state;
  return { ...state, started: true, activeIndex: 0, round: 1 };
}

export function endCombat(state: InitiativeState): InitiativeState {
  return { ...state, started: false, order: [], activeIndex: 0, round: 1 };
}

export function nextTurn(state: InitiativeState): InitiativeState {
  if (!state.started || state.order.length === 0) return state;
  const next = state.activeIndex + 1;
  if (next < state.order.length) return { ...state, activeIndex: next };
  return { ...state, activeIndex: 0, round: state.round + 1 };
}

export function prevTurn(state: InitiativeState): InitiativeState {
  if (!state.started || state.order.length === 0) return state;
  const prev = state.activeIndex - 1;
  if (prev >= 0) return { ...state, activeIndex: prev };
  return { ...state, activeIndex: state.order.length - 1, round: Math.max(1, state.round - 1) };
}

export function adjustHp(state: InitiativeState, id: Id, delta: number): InitiativeState {
  const combatants = state.encounter.combatants.map((c) => {
    if (c.id !== id) return c;
    const hpCurrent = Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta));
    return { ...c, hpCurrent };
  });
  return { ...state, encounter: { ...state.encounter, combatants } };
}

export function removeCombatant(state: InitiativeState, id: Id): InitiativeState {
  const combatants = state.encounter.combatants.filter((c) => c.id !== id);
  const order = state.order.filter((x) => x !== id);
  const activeIndex = Math.min(state.activeIndex, Math.max(0, order.length - 1));
  return { ...state, encounter: { ...state.encounter, combatants }, order, activeIndex };
}
export function importCombatants(
  state: InitiativeState,
  saved: Array<Omit<Combatant, "id" | "initiativeRoll" | "initiativeTotal">>
): InitiativeState {
  let next = state;
  for (const s of saved) {
    next = addCombatant(next, {
      name: s.name,
      kind: s.kind,
      faction: s.faction,
      initiativeMod: s.initiativeMod,
      hpMax: s.hpMax,
    });
    // set current HP (optional)
    const added = next.encounter.combatants[next.encounter.combatants.length - 1];
    if (added) {
      const desired = (s as any).hpCurrent ?? s.hpMax;
      added.hpCurrent = Math.max(0, Math.min(s.hpMax, desired));
    }
  }
  return next;
}

import type { DiplomacyConfig } from '@config';
import type { Empire, GameNotification, GalaxyState, StarSystem } from '@domain/types';

const clampOpinion = (value: number) => Math.max(-100, Math.min(100, value));

export const advanceDiplomacy = ({
  empires,
  config,
  tick,
  playerFleetPower = 0,
}: {
  empires: Empire[];
  config: DiplomacyConfig;
  tick: number;
  playerFleetPower?: number;
}): {
  empires: Empire[];
  notifications: GameNotification[];
  warsStarted: string[];
  warsEnded: string[];
} => {
  if (empires.length <= 1) {
    return { empires, notifications: [], warsStarted: [], warsEnded: [] };
  }
  if (tick % Math.max(1, config.autoCheckInterval) !== 0) {
    return { empires, notifications: [], warsStarted: [], warsEnded: [] };
  }

  const notifications: GameNotification[] = [];
  const warsStarted: string[] = [];
  const warsEnded: string[] = [];
  const updated = empires.map((entry) => ({ ...entry }));

  updated.forEach((empire) => {
    if (empire.kind === 'player') {
      return;
    }
    const drifted = clampOpinion(
      empire.opinion + config.opinionDriftPerCheck,
    );
    empire.opinion = drifted;

    if (empire.warStatus === 'peace' && drifted <= config.warThreshold) {
      empire.warStatus = 'war';
      empire.warSince = tick;
      warsStarted.push(empire.id);
      notifications.push({
        id: `notif-${crypto.randomUUID()}`,
        tick,
        kind: 'warDeclared',
        message: `${empire.name} ha dichiarato guerra!`,
      });
    } else if (
      empire.warStatus === 'war' &&
      (drifted >= config.peaceThreshold ||
        evaluatePeaceAcceptance({ empire, playerFleetPower }))
    ) {
      empire.warStatus = 'peace';
      empire.warSince = null;
      warsEnded.push(empire.id);
      notifications.push({
        id: `notif-${crypto.randomUUID()}`,
        tick,
        kind: 'peaceAccepted',
        message: `${empire.name} accetta una tregua.`,
      });
    }
  });

  return { empires: updated, notifications, warsStarted, warsEnded };
};

export const applyWarPressureToGalaxy = ({
  galaxy,
  warsStarted,
  tick,
  config,
}: {
  galaxy: GalaxyState;
  warsStarted: string[];
  tick: number;
  config: DiplomacyConfig['warZones'];
}): GalaxyState => {
  if (warsStarted.length === 0) {
    return galaxy;
  }
  const systems = galaxy.systems.slice();
  const maxIndex = Math.max(1, systems.length - 1);

  warsStarted.forEach((_, idx) => {
    for (let offset = 0; offset < config.count; offset += 1) {
      const index = 1 + ((tick + idx * 3 + offset) % maxIndex);
      const system = systems[index];
      if (!system) {
        continue;
      }
      const powerSpan = Math.max(1, config.powerMax - config.powerMin);
      const power =
        config.powerMin + ((tick + offset + idx) % powerSpan);
      systems[index] = {
        ...system,
        hostilePower: Math.max(system.hostilePower ?? 0, power),
      };
    }
  });

  return { ...galaxy, systems };
};

export const assignBordersToPlayer = (
  galaxy: GalaxyState,
  colonizedSystems: Set<string>,
): GalaxyState => {
  if (colonizedSystems.size === 0) {
    return galaxy;
  }
  const systems = galaxy.systems.map((system, idx) => {
    if (idx === 0 || colonizedSystems.has(system.id)) {
      return { ...system, ownerId: 'player' };
    }
    if (system.ownerId && system.ownerId !== 'player') {
      return system;
    }
    return system;
  });
  return { ...galaxy, systems };
};

export const intensifyWarZones = ({
  galaxy,
  empires,
  tick,
  config,
}: {
  galaxy: GalaxyState;
  empires: Empire[];
  tick: number;
  config: DiplomacyConfig['warZones'];
}): GalaxyState => {
  const warEmps = empires.filter(
    (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
  );
  if (warEmps.length === 0) {
    return galaxy;
  }
  if (tick % 8 !== 0) {
    return galaxy;
  }
  const systems = galaxy.systems.slice();
  const maxIndex = Math.max(1, systems.length - 1);
  warEmps.forEach((_, idx) => {
    const index = 1 + ((tick + idx) % maxIndex);
    const system = systems[index];
    if (!system) {
      return;
    }
    const powerSpan = Math.max(1, config.powerMax - config.powerMin);
    const power = config.powerMin + ((tick + idx) % powerSpan);
    systems[index] = {
      ...system,
      hostilePower: Math.max(system.hostilePower ?? 0, power),
    };
  });
  return { ...galaxy, systems };
};

export const evaluatePeaceAcceptance = ({
  empire,
  playerFleetPower,
}: {
  empire: Empire;
  playerFleetPower: number;
}): boolean => {
  const hostility = Math.abs(empire.opinion);
  const needsPeace = empire.opinion > -20 && playerFleetPower > 12;
  return needsPeace || hostility < 15;
};

export const getAiHomeSystem = (galaxy: GalaxyState): StarSystem | null =>
  galaxy.systems[1] ?? galaxy.systems[0] ?? null;

export const getNextColonizableSystem = (
  galaxy: GalaxyState,
  systemsKnown: Set<string>,
): StarSystem | null => {
  const candidates = galaxy.systems.filter(
    (system) =>
      !systemsKnown.has(system.id) && system.habitableWorld && system.visibility !== 'unknown',
  );
  return candidates[0] ?? null;
};



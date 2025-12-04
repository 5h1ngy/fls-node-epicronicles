import type {
  EventLogEntry,
  EventOption,
  EventOptionEffect,
  GameEvent,
  GameSession,
  ResourceType,
} from '@domain/types';
import type {
  EventsConfig,
  EventDefinition,
  GameConfig,
} from '@config';
import { canAffordCost, spendResources } from '@domain/economy/economy';

export interface EventState {
  active: GameEvent | null;
  log: EventLogEntry[];
}

const resourceLabels: Record<ResourceType, string> = {
  energy: 'Energia',
  minerals: 'Minerali',
  food: 'Cibo',
  research: 'Ricerca',
  influence: 'Influenza',
};

const applyEffect = (
  session: GameSession,
  effect: EventOptionEffect,
  eventsConfig: EventsConfig,
  gameConfig: GameConfig,
  fallbackSystemId?: string | null,
): { session: GameSession; queuedEvent: GameEvent | null } => {
  switch (effect.kind) {
    case 'resource': {
      if (!effect.target) {
        return { session, queuedEvent: null };
      }
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return { session, queuedEvent: null };
      }
      const resources = { ...session.economy.resources };
      const ledger = resources[effect.target];
      if (!ledger) {
        return { session, queuedEvent: null };
      }
      resources[effect.target] = {
        ...ledger,
        amount: Math.max(0, ledger.amount + delta),
      };
      return {
        session: {
          ...session,
          economy: { ...session.economy, resources },
        },
        queuedEvent: null,
      };
    }
    case 'influence': {
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return { session, queuedEvent: null };
      }
      const resources = { ...session.economy.resources };
      const ledger = resources.influence;
      resources.influence = {
        ...ledger,
        amount: Math.max(0, (ledger?.amount ?? 0) + delta),
      };
      return {
        session: {
          ...session,
          economy: { ...session.economy, resources },
        },
        queuedEvent: null,
      };
    }
    case 'hostileSpawn': {
      const targetSystemId = effect.systemId ?? fallbackSystemId;
      const delta = effect.amount ?? 0;
      if (!targetSystemId || delta === 0) {
        return { session, queuedEvent: null };
      }
      const systems = session.galaxy.systems.map((system) =>
        system.id === targetSystemId
          ? { ...system, hostilePower: Math.max(0, (system.hostilePower ?? 0) + delta) }
          : system,
      );
      return {
        session: { ...session, galaxy: { ...session.galaxy, systems } },
        queuedEvent: null,
      };
    }
    case 'stability': {
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return { session, queuedEvent: null };
      }
      const planets = session.economy.planets.map((planet) => ({
        ...planet,
        stability: Math.max(20, Math.min(95, planet.stability + delta)),
      }));
      return {
        session: { ...session, economy: { ...session.economy, planets } },
        queuedEvent: null,
      };
    }
    case 'triggerEvent': {
      if (!effect.nextEventId) {
        return { session, queuedEvent: null };
      }
      const next = instantiateEventById(
        eventsConfig,
        effect.nextEventId,
        fallbackSystemId ?? undefined,
      );
      return { session, queuedEvent: next };
    }
    case 'insight':
      {
        const techId = effect.techId;
        const perkId = effect.perkId;
        let updated = session;

        if (techId) {
          const techDef = gameConfig.research.techs.find((t) => t.id === techId);
          if (techDef) {
            const branchState = session.research.branches[techDef.branch];
            const alreadyCompleted = branchState.completed.includes(techDef.id);
            const alreadyQueued = session.research.backlog.some(
              (entry) => entry.id === techDef.id,
            );
            if (!alreadyCompleted && !alreadyQueued) {
              updated = {
                ...updated,
                research: {
                  ...updated.research,
                  backlog: [...updated.research.backlog, techDef],
                },
              };
            }
          }
        }

        if (perkId) {
          const perkDef = gameConfig.traditions.perks.find((p) => p.id === perkId);
          if (perkDef) {
            const alreadyUnlocked = session.traditions.unlocked.includes(perkDef.id);
            const alreadyQueued = session.traditions.backlog.some(
              (entry) => entry.id === perkDef.id,
            );
            if (!alreadyUnlocked && !alreadyQueued) {
              updated = {
                ...updated,
                traditions: {
                  ...updated.traditions,
                  backlog: [...updated.traditions.backlog, perkDef],
                },
              };
            }
          }
        }

        return { session: updated, queuedEvent: null };
      }
    default:
      return { session, queuedEvent: null };
  }
};

export const resolveEvent = ({
  session,
  option,
  activeEvent,
  tick,
  config,
}: {
  session: GameSession;
  option: EventOption;
  activeEvent: GameEvent;
  tick: number;
  config: GameConfig;
}): { session: GameSession; logEntry: EventLogEntry; queued: GameEvent[] } => {
  let updatedSession = session;
  const queued: GameEvent[] = [];
  option.effects.forEach((effect) => {
    const { session: nextSession, queuedEvent } = applyEffect(
      updatedSession,
      effect,
      config.events,
      config,
      activeEvent.systemId,
    );
    updatedSession = nextSession;
    if (queuedEvent) {
      queued.push(queuedEvent);
    }
  });

  const logEntry: EventLogEntry = {
    id: `evt-log-${activeEvent.id}`,
    tick,
    title: activeEvent.title,
    result: option.label,
  };
  return { session: updatedSession, logEntry, queued };
};

export const canAffordOption = (
  session: GameSession,
  option: EventOption,
): boolean => {
  const costEffects = option.effects.filter(
    (effect) => effect.kind === 'resource' && (effect.amount ?? 0) < 0,
  );
  if (costEffects.length === 0) {
    return true;
  }
  const cost = costEffects.reduce<Record<ResourceType, number>>((acc, effect) => {
    const target = effect.target;
    if (target && typeof effect.amount === 'number' && effect.amount < 0) {
      acc[target] = Math.abs(effect.amount);
    }
    return acc;
  }, {} as Record<ResourceType, number>);
  return canAffordCost(session.economy, cost);
};

export const applyOptionCost = (
  session: GameSession,
  option: EventOption,
): GameSession['economy'] => {
  const cost = option.effects.reduce<Record<ResourceType, number>>((acc, effect) => {
    if (effect.kind !== 'resource' || !effect.target) {
      return acc;
    }
    if (typeof effect.amount === 'number' && effect.amount < 0) {
      acc[effect.target] = Math.abs(effect.amount);
    }
    return acc;
  }, {} as Record<ResourceType, number>);
  return spendResources(session.economy, cost);
};

const pick = <T>(items: T[]): T | null =>
  items.length === 0 ? null : items[Math.floor(Math.random() * items.length)];

const instantiateEvent = (def: EventDefinition, systemId?: string): GameEvent => ({
  ...def,
  id: `${def.id}-${crypto.randomUUID()}`,
  systemId: systemId ?? null,
  resolvedOptionId: null,
});

const instantiateEventById = (
  config: EventsConfig,
  id: string,
  systemId?: string,
): GameEvent | null => {
  const source =
    config.narrative.find((e) => e.id === id) ??
    config.anomalies.find((e) => e.id === id) ??
    config.crisis.find((e) => e.id === id);
  return source ? instantiateEvent(source, systemId) : null;
};

const createNarrativeEvent = (config: EventsConfig): GameEvent | null => {
  const definitions = config.narrative;
  const def = pick(definitions);
  if (!def) {
    return null;
  }
  return instantiateEvent(def);
};

const createAnomalyEvent = (config: EventsConfig, systemId: string): GameEvent | null => {
  const def = pick(config.anomalies);
  if (!def) {
    return null;
  }
  return instantiateEvent(def, systemId);
};

const createCrisisEvent = (config: EventsConfig, systemId: string): GameEvent | null => {
  const def = pick(config.crisis);
  if (!def) {
    return null;
  }
  return instantiateEvent(def, systemId);
};

export const maybeSpawnEvent = ({
  session,
  config,
  tick,
}: {
  session: GameSession;
  config: EventsConfig;
  tick: number;
}): GameEvent | null => {
  const lastLogTick = session.events.log.at(-1)?.tick ?? null;
  if (lastLogTick !== null && tick - lastLogTick < 8) {
    return null;
  }
  const lastWarEventTick =
    session.warEvents.length > 0
      ? session.warEvents[session.warEvents.length - 1].tick
      : null;
  if (lastWarEventTick !== null && tick - lastWarEventTick < 5) {
    return null;
  }
  if (session.notifications.some((n) => n.kind === 'eventStarted' && tick - n.tick < 4)) {
    return null;
  }
  if (session.warEvents.length > 0 && Math.random() < 0.2) {
    return null;
  }

  if (tick > 40 && tick % config.crisisIntervalTicks === 0) {
    const target = pick(session.galaxy.systems.filter((s) => s.visibility === 'surveyed'));
    return target ? createCrisisEvent(config, target.id) : null;
  }

  if (tick > 15 && tick % config.anomalyIntervalTicks === 0) {
    const target = pick(
      session.galaxy.systems.filter(
        (s) => s.visibility === 'surveyed' && (s.hostilePower ?? 0) === 0,
      ),
    );
    return target ? createAnomalyEvent(config, target.id) : null;
  }

  if (tick > 10 && tick % config.narrativeIntervalTicks === 0) {
    return createNarrativeEvent(config);
  }

  return null;
};

export const formatOptionCost = (option: EventOption): string => {
  const costs = option.effects.filter(
    (e) => e.kind === 'resource' && (e.amount ?? 0) < 0 && e.target,
  );
  if (costs.length === 0) {
    return '';
  }
  return costs
    .map((c) => `${resourceLabels[c.target as ResourceType]} ${Math.abs(c.amount ?? 0)}`)
    .join(', ');
};

import { create } from 'zustand';
import { gameConfig, type GameConfig } from '../config/gameConfig';
import { advanceClock, setClockRunning, setClockSpeed } from '../domain/clock';
import { createSession } from '../domain/session';
import type {
  GameSession,
  GameView,
  ScienceShipStatus,
  ShipClassId,
  SystemVisibility,
} from '../domain/types';
import { advanceSimulation } from '../domain/simulation';
import { createColonizationTask } from '../domain/colonization';
import { canAffordCost, spendResources } from '../domain/economy';
import { createShipyardTask } from '../domain/shipyard';
import { calculateTravelTicks } from '../domain/fleets';

export interface StartSessionArgs {
  seed?: string;
  label?: string;
}

export type ColonizationError =
  | 'NO_SESSION'
  | 'SYSTEM_NOT_FOUND'
  | 'SYSTEM_NOT_SURVEYED'
  | 'NO_HABITABLE_WORLD'
  | 'ALREADY_COLONIZED'
  | 'TASK_IN_PROGRESS'
  | 'INSUFFICIENT_RESOURCES';

export type StartColonizationResult =
  | { success: true }
  | { success: false; reason: ColonizationError };

export type BuildShipError =
  | 'NO_SESSION'
  | 'INVALID_DESIGN'
  | 'QUEUE_FULL'
  | 'INSUFFICIENT_RESOURCES';

export type QueueShipBuildResult =
  | { success: true }
  | { success: false; reason: BuildShipError };

export type FleetOrderError =
  | 'NO_SESSION'
  | 'FLEET_NOT_FOUND'
  | 'SYSTEM_NOT_FOUND'
  | 'ALREADY_IN_SYSTEM'
  | 'NO_SHIPS';

export type FleetMoveResult =
  | { success: true }
  | { success: false; reason: FleetOrderError };

export type ScienceShipOrderError =
  | 'NO_SESSION'
  | 'SHIP_NOT_FOUND'
  | 'SYSTEM_NOT_FOUND';

export type ScienceShipOrderResult =
  | { success: true }
  | { success: false; reason: ScienceShipOrderError };

interface GameStoreState {
  view: GameView;
  config: GameConfig;
  session: GameSession | null;
  startNewSession: (args?: StartSessionArgs) => void;
  returnToMenu: () => void;
  setSimulationRunning: (isRunning: boolean, now?: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  advanceClockBy: (elapsedMs: number, now: number) => void;
  startColonization: (systemId: string) => StartColonizationResult;
  queueShipBuild: (designId: ShipClassId) => QueueShipBuildResult;
  orderFleetMove: (fleetId: string, systemId: string) => FleetMoveResult;
  orderScienceShip: (
    shipId: string,
    systemId: string,
  ) => ScienceShipOrderResult;
  setScienceAutoExplore: (shipId: string, auto: boolean) => void;
}

const tickDurationMs = (cfg: GameConfig) =>
  Math.max(16, Math.round(1000 / cfg.ticksPerSecond));

export const useGameStore = create<GameStoreState>((set, get) => ({
  view: 'mainMenu',
  config: gameConfig,
  session: null,
  startNewSession: (args) => {
    const cfg = get().config;
    const seed = args?.seed ?? cfg.defaultGalaxy.seed;
    const session = createSession({
      seed,
      label: args?.label,
      galaxyOverrides: {
        systemCount: cfg.defaultGalaxy.systemCount,
        galaxyRadius: cfg.defaultGalaxy.galaxyRadius,
      },
      economyConfig: cfg.economy,
      militaryConfig: cfg.military,
    });
    set({ session, view: 'simulation' });
  },
  returnToMenu: () => set({ view: 'mainMenu', session: null }),
  setSimulationRunning: (isRunning, now = Date.now()) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          clock: setClockRunning(state.session.clock, isRunning, now),
        },
      };
    }),
  setSpeedMultiplier: (speed) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          clock: setClockSpeed(state.session.clock, speed),
        },
      };
    }),
  advanceClockBy: (elapsedMs, now) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      const cfg = state.config;
      const updatedClock = advanceClock({
        clock: state.session.clock,
        elapsedMs,
        tickDurationMs: tickDurationMs(cfg),
        now,
      });

      const ticksAdvanced = updatedClock.tick - state.session.clock.tick;
      const simulatedSession =
        ticksAdvanced > 0
          ? advanceSimulation(state.session, ticksAdvanced, cfg)
          : state.session;

      return {
        ...state,
        session: {
          ...simulatedSession,
          clock: updatedClock,
        },
      };
    }),
  startColonization: (systemId) => {
    const state = get();
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const system = session.galaxy.systems.find(
      (candidate) => candidate.id === systemId,
    );
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (system.visibility !== 'surveyed') {
      return { success: false, reason: 'SYSTEM_NOT_SURVEYED' };
    }
    if (!system.habitableWorld) {
      return { success: false, reason: 'NO_HABITABLE_WORLD' };
    }
    const alreadyColonized = session.economy.planets.some(
      (planet) => planet.systemId === systemId,
    );
    if (alreadyColonized) {
      return { success: false, reason: 'ALREADY_COLONIZED' };
    }
    const taskInProgress = session.colonizationTasks.some(
      (task) => task.systemId === systemId,
    );
    if (taskInProgress) {
      return { success: false, reason: 'TASK_IN_PROGRESS' };
    }
    const cost = state.config.colonization.cost;
    if (!canAffordCost(session.economy, cost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, cost);
    const task = createColonizationTask(system, state.config.colonization);

    set({
      session: {
        ...session,
        economy: updatedEconomy,
        colonizationTasks: [...session.colonizationTasks, task],
      },
    });

    return { success: true };
  },
  queueShipBuild: (designId) => {
    const state = get();
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }

    const design = state.config.military.shipDesigns.find(
      (entry) => entry.id === designId,
    );
    if (!design) {
      return { success: false, reason: 'INVALID_DESIGN' };
    }

    if (
      session.shipyardQueue.length >= state.config.military.shipyard.queueSize
    ) {
      return { success: false, reason: 'QUEUE_FULL' };
    }

    if (!canAffordCost(session.economy, design.buildCost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, design.buildCost);
    const task = createShipyardTask(design.id, design.buildTime);

    set({
      session: {
        ...session,
        economy: updatedEconomy,
        shipyardQueue: [...session.shipyardQueue, task],
      },
    });

    return { success: true };
  },
  orderFleetMove: (fleetId, systemId) => {
    const state = get();
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const fleet = session.fleets.find((entry) => entry.id === fleetId);
    if (!fleet) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    const system = session.galaxy.systems.find(
      (candidate) => candidate.id === systemId,
    );
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (fleet.systemId === systemId && fleet.targetSystemId === null) {
      return { success: false, reason: 'ALREADY_IN_SYSTEM' };
    }
    if (fleet.ships.length === 0) {
      return { success: false, reason: 'NO_SHIPS' };
    }

    const travelTicks = calculateTravelTicks(
      fleet.systemId,
      systemId,
      session.galaxy,
      state.config,
    );

    set({
      session: {
        ...session,
        fleets: session.fleets.map((entry) =>
          entry.id === fleetId
            ? {
                ...entry,
                targetSystemId: systemId,
                ticksToArrival: travelTicks,
              }
            : entry,
        ),
      },
    });

    return { success: true };
  },
  orderScienceShip: (shipId, systemId) => {
    const state = get();
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const shipIndex = session.scienceShips.findIndex(
      (ship) => ship.id === shipId,
    );
    if (shipIndex < 0) {
      return { success: false, reason: 'SHIP_NOT_FOUND' };
    }
    const targetSystem = session.galaxy.systems.find(
      (system) => system.id === systemId,
    );
    if (!targetSystem) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }

    const travelTicks = Math.max(1, state.config.exploration.travelTicks);
    const updatedShips = session.scienceShips.map((ship) =>
      ship.id === shipId
        ? {
            ...ship,
            autoExplore: false,
            status: 'traveling' as ScienceShipStatus,
            targetSystemId: systemId,
            ticksRemaining: travelTicks,
          }
        : ship,
    );

    const visibilityRank: Record<'unknown' | 'revealed' | 'surveyed', number> = {
      unknown: 0,
      revealed: 1,
      surveyed: 2,
    };
    const updatedSystems = session.galaxy.systems.map((system) => {
      if (system.id !== systemId) {
        return system;
      }
      if (visibilityRank[system.visibility] >= visibilityRank.revealed) {
        return system;
      }
      return {
        ...system,
        visibility: 'revealed' as SystemVisibility,
      };
    });

    set({
      session: {
        ...session,
        scienceShips: updatedShips,
        galaxy:
          updatedSystems === session.galaxy.systems
            ? session.galaxy
            : { ...session.galaxy, systems: updatedSystems },
      },
    });

    return { success: true };
  },
  setScienceAutoExplore: (shipId, auto) => {
    const session = get().session;
    if (!session) {
      return;
    }
    const updatedShips = session.scienceShips.map((ship) =>
      ship.id === shipId
        ? {
            ...ship,
            autoExplore: auto,
          }
        : ship,
    );
    set({
      session: {
        ...session,
        scienceShips: updatedShips,
      },
    });
  },
}));

import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type AnyAction,
  type ThunkAction,
} from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { useMemo } from 'react';
import { gameConfig, type GameConfig } from '../config/gameConfig';
import {
  advanceClock,
  setClockRunning,
  setClockSpeed,
} from '../domain/clock';
import { createSession } from '../domain/session';
import type {
  GameSession,
  GameNotification,
  GameView,
  EconomyState,
  ScienceShipStatus,
  ShipClassId,
  SystemVisibility,
  PopulationJobId,
  Planet,
  NotificationKind,
  ResourceType,
  ResourceCost,
  WarStatus,
  Empire,
} from '../domain/types';
import { advanceSimulation } from '../domain/simulation';
import { createColonizationTask } from '../domain/colonization';
import { canAffordCost, spendResources } from '../domain/economy';
import { createShipyardTask } from '../domain/shipyard';
import { calculateTravelTicks } from '../domain/fleets';
import { createDistrictConstructionTask } from '../domain/districts';
import { applyWarPressureToGalaxy } from '../domain/diplomacy';

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
  | 'INSUFFICIENT_RESOURCES'
  | 'NO_COLONY_SHIP';

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
  | 'SYSTEM_NOT_FOUND'
  | 'SYSTEM_UNKNOWN';

export type ScienceShipOrderResult =
  | { success: true }
  | { success: false; reason: ScienceShipOrderError };

export type DistrictBuildError =
  | 'NO_SESSION'
  | 'PLANET_NOT_FOUND'
  | 'INVALID_DISTRICT'
  | 'INSUFFICIENT_RESOURCES';

export type QueueDistrictBuildResult =
  | { success: true }
  | { success: false; reason: DistrictBuildError };

export type DistrictQueueManageError =
  | 'NO_SESSION'
  | 'TASK_NOT_FOUND'
  | 'PLANET_NOT_FOUND';

export type DistrictQueueManageResult =
  | { success: true }
  | { success: false; reason: DistrictQueueManageError };

export type PopulationAdjustError =
  | 'NO_SESSION'
  | 'PLANET_NOT_FOUND'
  | 'INVALID_JOB'
  | 'NO_WORKERS'
  | 'NO_POPULATION';

export type PopulationAdjustResult =
  | { success: true }
  | { success: false; reason: PopulationAdjustError };

export type DiplomacyActionError =
  | 'NO_SESSION'
  | 'EMPIRE_NOT_FOUND'
  | 'INVALID_TARGET'
  | 'ALREADY_IN_STATE';

export type DiplomacyActionResult =
  | { success: true }
  | { success: false; reason: DiplomacyActionError };

interface GameSliceState {
  view: GameView;
  config: GameConfig;
  session: GameSession | null;
}

const initialState: GameSliceState = {
  view: 'mainMenu',
  config: gameConfig,
  session: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startSessionSuccess(state, action: PayloadAction<GameSession>) {
      state.session = action.payload;
      state.view = 'simulation';
    },
    returnToMenu(state) {
      state.session = null;
      state.view = 'mainMenu';
    },
    setSessionState(state, action: PayloadAction<GameSession | null>) {
      state.session = action.payload;
    },
  },
});

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

export const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const tickDurationMs = (cfg: GameConfig) =>
  Math.max(16, Math.round(1000 / cfg.ticksPerSecond));

const setSession = (session: GameSession | null): PayloadAction<GameSession | null> =>
  gameSlice.actions.setSessionState(session);

const startSessionSuccess = gameSlice.actions.startSessionSuccess;
export const returnToMenu = gameSlice.actions.returnToMenu;

export const startNewSession =
  (args?: StartSessionArgs): AppThunk<void> =>
  (dispatch, getState) => {
    const cfg = getState().game.config;
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
      diplomacyConfig: cfg.diplomacy,
    });
    dispatch(startSessionSuccess(session));
  };

export const setSimulationRunning =
  (isRunning: boolean, now = Date.now()): AppThunk<void> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockRunning(session.clock, isRunning, now),
    };
    dispatch(setSession(updated));
  };

export const setSpeedMultiplier =
  (speed: number): AppThunk<void> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockSpeed(session.clock, speed),
    };
    dispatch(setSession(updated));
  };

export const advanceClockBy =
  (elapsedMs: number, now: number): AppThunk<void> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return;
    }

    const updatedClock = advanceClock({
      clock: session.clock,
      elapsedMs,
      tickDurationMs: tickDurationMs(state.config),
      now,
    });

    const ticksAdvanced = updatedClock.tick - session.clock.tick;
    const simulatedSession =
      ticksAdvanced > 0
        ? advanceSimulation(session, ticksAdvanced, state.config)
        : session;

    dispatch(
      setSession({
        ...simulatedSession,
        clock: updatedClock,
      }),
    );
  };

export const startColonization =
  (systemId: string): AppThunk<StartColonizationResult> =>
  (dispatch, getState) => {
    const state = getState().game;
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
    const planetKnown = session.economy.planets.some(
      (planet) => planet.systemId === systemId,
    );
    if (system.visibility !== 'surveyed' && !planetKnown) {
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

    const colonyDesignId = state.config.military.colonyShipDesignId;
    const colonyShip = detachColonyShip(session.fleets, colonyDesignId);
    if (!colonyShip) {
      return { success: false, reason: 'NO_COLONY_SHIP' };
    }

    const updatedEconomy = spendResources(session.economy, cost);
    const task = createColonizationTask(
      system,
      state.config.colonization,
      colonyShip.shipId,
    );
    const sessionWithTask = {
      ...session,
      economy: updatedEconomy,
      fleets: colonyShip.fleets,
      colonizationTasks: [...session.colonizationTasks, task],
    };
    dispatch(
      setSession(
        appendNotification(
          sessionWithTask,
          `Missione di colonizzazione avviata verso ${system.name}.`,
          'colonizationStarted',
        ),
      ),
    );

    return { success: true };
  };

export const queueShipBuild =
  (designId: ShipClassId): AppThunk<QueueShipBuildResult> =>
  (dispatch, getState) => {
    const state = getState().game;
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

    dispatch(
      setSession({
        ...session,
        economy: updatedEconomy,
        shipyardQueue: [...session.shipyardQueue, task],
      }),
    );

    return { success: true };
  };

export const queueDistrictConstruction =
  (
    planetId: string,
    districtId: string,
  ): AppThunk<QueueDistrictBuildResult> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    const definition = state.config.economy.districts.find(
      (entry) => entry.id === districtId,
    );
    if (!definition) {
      return { success: false, reason: 'INVALID_DISTRICT' };
    }
    if (!canAffordCost(session.economy, definition.cost)) {
      dispatch(
        setSession(
          appendNotification(
            session,
            `Costruzione ${definition.label} sospesa: risorse insufficienti.`,
            'districtSuspended',
          ),
        ),
      );
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, definition.cost);
    const task = createDistrictConstructionTask({
      planetId,
      districtId,
      buildTime: Math.max(1, definition.buildTime),
    });

    dispatch(
      setSession({
        ...session,
        economy: updatedEconomy,
        districtConstructionQueue: [
          ...session.districtConstructionQueue,
          task,
        ],
      }),
    );

    return { success: true };
  };

export const cancelDistrictTask =
  (taskId: string): AppThunk<DistrictQueueManageResult> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const queue = session.districtConstructionQueue;
    const task = queue.find((entry) => entry.id === taskId);
    if (!task) {
      return { success: false, reason: 'TASK_NOT_FOUND' };
    }
    const planet = session.economy.planets.find(
      (entry) => entry.id === task.planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    const definition = state.config.economy.districts.find(
      (entry) => entry.id === task.districtId,
    );
    const refundedEconomy = definition
      ? refundResourceCost(session.economy, definition.cost)
      : session.economy;

    dispatch(
      setSession({
        ...session,
        economy: refundedEconomy,
        districtConstructionQueue: queue.filter(
          (entry) => entry.id !== taskId,
        ),
      }),
    );
    return { success: true };
  };

export const prioritizeDistrictTask =
  (taskId: string): AppThunk<DistrictQueueManageResult> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const queue = [...session.districtConstructionQueue];
    const index = queue.findIndex((entry) => entry.id === taskId);
    if (index < 0) {
      return { success: false, reason: 'TASK_NOT_FOUND' };
    }
    const [task] = queue.splice(index, 1);
    queue.unshift(task);
    dispatch(
      setSession({
        ...session,
        districtConstructionQueue: queue,
      }),
    );
    return { success: true };
  };

const detachColonyShip = (
  fleets: GameSession['fleets'],
  designId: ShipClassId,
): { fleets: GameSession['fleets']; shipId: string } | null => {
  let shipId: string | null = null;
  const updatedFleets = fleets.map((fleet) => {
    if (shipId) {
      return fleet;
    }
    const shipIndex = fleet.ships.findIndex(
      (ship) => ship.designId === designId,
    );
    if (shipIndex < 0) {
      return fleet;
    }
    shipId = fleet.ships[shipIndex].id;
    return {
      ...fleet,
      ships: fleet.ships.filter((_, index) => index !== shipIndex),
    };
  });
  if (!shipId) {
    return null;
  }
  return { fleets: updatedFleets, shipId };
};

const appendNotification = (
  session: GameSession,
  message: string,
  kind: NotificationKind,
  tick?: number,
): GameSession => {
  const entry: GameNotification = {
    id: `notif-${crypto.randomUUID()}`,
    tick: tick ?? session.clock.tick,
    kind,
    message,
  };
  return {
    ...session,
    notifications: [...session.notifications, entry].slice(-6),
  };
};

const setEmpireWarStatus = (
  empires: Empire[],
  targetId: string,
  status: WarStatus,
  opinionDelta = 0,
  warSince?: number | null,
): Empire[] => {
  let changed = false;
  const updated = empires.map((empire) => {
    if (empire.id !== targetId) {
      return empire;
    }
    changed = true;
    const nextWarSince =
      status === 'war'
        ? warSince ?? empire.warSince ?? 0
        : null;
    return {
      ...empire,
      warStatus: status,
      warSince: nextWarSince,
      opinion: empire.opinion + opinionDelta,
    };
  });
  return changed ? updated : empires;
};

const refundResourceCost = (
  economy: EconomyState,
  cost: ResourceCost,
): EconomyState => {
  const resources = { ...economy.resources };
  Object.entries(cost).forEach(([type, amount]) => {
    if (!amount) {
      return;
    }
    const resourceType = type as ResourceType;
    const ledger = resources[resourceType];
    resources[resourceType] = {
      amount: (ledger?.amount ?? 0) + amount,
      income: ledger?.income ?? 0,
      upkeep: ledger?.upkeep ?? 0,
    };
  });
  return {
    ...economy,
    resources,
  };
};

const updatePlanetPopulation = (
  planet: Planet,
  updates: Partial<Planet['population']>,
): Planet => ({
  ...planet,
  population: {
    ...planet.population,
    ...updates,
  },
});

const updatePopulationCounts = (
  planet: Planet,
  changes: Partial<Record<PopulationJobId, number>>,
): Planet => {
  const next = { ...planet.population };
  (Object.keys(changes) as PopulationJobId[]).forEach((jobId) => {
    const delta = changes[jobId] ?? 0;
    next[jobId] = Math.max(0, next[jobId] + delta);
  });
  return updatePlanetPopulation(planet, next);
};

export const promotePopulation =
  (planetId: string, jobId: PopulationJobId): AppThunk<PopulationAdjustResult> =>
  (dispatch, getState) => {
    if (jobId === 'workers') {
      return { success: false, reason: 'INVALID_JOB' };
    }
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    if (planet.population.workers <= 0) {
      return { success: false, reason: 'NO_WORKERS' };
    }

    const updatedPlanets = session.economy.planets.map((p) =>
      p.id === planetId
        ? updatePopulationCounts(p, { workers: -1, [jobId]: 1 })
        : p,
    );

    dispatch(
      setSession({
        ...session,
        economy: {
          ...session.economy,
          planets: updatedPlanets,
        },
      }),
    );
    return { success: true };
  };

export const demotePopulation =
  (planetId: string, jobId: PopulationJobId): AppThunk<PopulationAdjustResult> =>
  (dispatch, getState) => {
    if (jobId === 'workers') {
      return { success: false, reason: 'INVALID_JOB' };
    }
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    if ((planet.population[jobId] ?? 0) <= 0) {
      return { success: false, reason: 'NO_POPULATION' };
    }

    const updatedPlanets = session.economy.planets.map((p) =>
      p.id === planetId
        ? updatePopulationCounts(p, { workers: 1, [jobId]: -1 })
        : p,
    );

    dispatch(
      setSession({
        ...session,
        economy: {
          ...session.economy,
          planets: updatedPlanets,
        },
      }),
    );
    return { success: true };
  };

export const declareWarOnEmpire =
  (empireId: string): AppThunk<DiplomacyActionResult> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const target = session.empires.find((empire) => empire.id === empireId);
    if (!target) {
      return { success: false, reason: 'EMPIRE_NOT_FOUND' };
    }
    if (target.kind === 'player') {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    if (target.warStatus === 'war') {
      return { success: false, reason: 'ALREADY_IN_STATE' };
    }
    const currentTick = session.clock.tick + 1;
    const empires = setEmpireWarStatus(
      session.empires,
      empireId,
      'war',
      -15,
      currentTick,
    );
    const galaxyWithPressure = applyWarPressureToGalaxy({
      galaxy: session.galaxy,
      warsStarted: [empireId],
      tick: currentTick,
      config: state.config.diplomacy.warZones,
    });
    const updatedSession = appendNotification(
      { ...session, empires, galaxy: galaxyWithPressure },
      `Guerra dichiarata contro ${target.name}.`,
      'warDeclared',
    );
    dispatch(setSession(updatedSession));
    return { success: true };
  };

export const proposePeaceWithEmpire =
  (empireId: string): AppThunk<DiplomacyActionResult> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const target = session.empires.find((empire) => empire.id === empireId);
    if (!target) {
      return { success: false, reason: 'EMPIRE_NOT_FOUND' };
    }
    if (target.kind === 'player') {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    if (target.warStatus === 'peace') {
      return { success: false, reason: 'ALREADY_IN_STATE' };
    }
    const empires = setEmpireWarStatus(
      session.empires,
      empireId,
      'peace',
      10,
      null,
    );
    const updatedSession = appendNotification(
      { ...session, empires },
      `Tregua firmata con ${target.name}.`,
      'peaceAccepted',
    );
    dispatch(setSession(updatedSession));
    return { success: true };
  };
export const orderFleetMove =
  (fleetId: string, systemId: string): AppThunk<FleetMoveResult> =>
  (dispatch, getState) => {
    const state = getState().game;
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

    dispatch(
      setSession({
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
      }),
    );

    return { success: true };
  };

export const orderScienceShip =
  (shipId: string, systemId: string): AppThunk<ScienceShipOrderResult> =>
  (dispatch, getState) => {
    const state = getState().game;
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
    if (targetSystem.visibility === 'unknown') {
      return { success: false, reason: 'SYSTEM_UNKNOWN' };
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

    const visibilityRank: Record<SystemVisibility, number> = {
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

    dispatch(
      setSession({
        ...session,
        scienceShips: updatedShips,
        galaxy:
          updatedSystems === session.galaxy.systems
            ? session.galaxy
            : { ...session.galaxy, systems: updatedSystems },
      }),
    );

    return { success: true };
  };

export const setScienceAutoExplore =
  (shipId: string, auto: boolean): AppThunk<void> =>
  (dispatch, getState) => {
    const session = getState().game.session;
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
    dispatch(
      setSession({
        ...session,
        scienceShips: updatedShips,
      }),
    );
  };

interface HookState extends GameSliceState {
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
  promotePopulation: (
    planetId: string,
    jobId: PopulationJobId,
  ) => PopulationAdjustResult;
  demotePopulation: (
    planetId: string,
    jobId: PopulationJobId,
  ) => PopulationAdjustResult;
  queueDistrictConstruction: (
    planetId: string,
    districtId: string,
  ) => QueueDistrictBuildResult;
  cancelDistrictTask: (
    taskId: string,
  ) => DistrictQueueManageResult;
  prioritizeDistrictTask: (
    taskId: string,
  ) => DistrictQueueManageResult;
  declareWarOnEmpire: (
    empireId: string,
  ) => DiplomacyActionResult;
  proposePeaceWithEmpire: (
    empireId: string,
  ) => DiplomacyActionResult;
}

export const useGameStore = <T>(
  selector: (state: HookState) => T,
): T => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root.game);
  const actions = useMemo(
    () => ({
      startNewSession: (args?: StartSessionArgs) =>
        dispatch(startNewSession(args)),
      returnToMenu: () => dispatch(returnToMenu()),
      setSimulationRunning: (isRunning: boolean, now?: number) =>
        dispatch(setSimulationRunning(isRunning, now)),
      setSpeedMultiplier: (speed: number) =>
        dispatch(setSpeedMultiplier(speed)),
      advanceClockBy: (elapsed: number, now: number) =>
        dispatch(advanceClockBy(elapsed, now)),
      startColonization: (systemId: string) =>
        dispatch(startColonization(systemId)),
      queueShipBuild: (designId: ShipClassId) =>
        dispatch(queueShipBuild(designId)),
      orderFleetMove: (fleetId: string, systemId: string) =>
        dispatch(orderFleetMove(fleetId, systemId)),
      orderScienceShip: (shipId: string, systemId: string) =>
        dispatch(orderScienceShip(shipId, systemId)),
      setScienceAutoExplore: (shipId: string, auto: boolean) =>
        dispatch(setScienceAutoExplore(shipId, auto)),
      queueDistrictConstruction: (planetId: string, districtId: string) =>
        dispatch(queueDistrictConstruction(planetId, districtId)),
      promotePopulation: (planetId: string, jobId: PopulationJobId) =>
        dispatch(promotePopulation(planetId, jobId)),
      demotePopulation: (planetId: string, jobId: PopulationJobId) =>
        dispatch(demotePopulation(planetId, jobId)),
      cancelDistrictTask: (taskId: string) =>
        dispatch(cancelDistrictTask(taskId)),
      prioritizeDistrictTask: (taskId: string) =>
        dispatch(prioritizeDistrictTask(taskId)),
      declareWarOnEmpire: (empireId: string) =>
        dispatch(declareWarOnEmpire(empireId)),
      proposePeaceWithEmpire: (empireId: string) =>
        dispatch(proposePeaceWithEmpire(empireId)),
    }),
    [dispatch],
  );

  return selector({ ...state, ...actions });
};

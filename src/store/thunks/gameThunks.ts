import { type ThunkAction, type AnyAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import {
  startSessionSuccess,
  returnToMenu as returnToMenuAction,
  setSessionState,
} from '../slice/gameSlice';
import type {
  StartColonizationResult,
  QueueShipBuildResult,
  FleetMoveResult,
  FleetMergeResult,
  FleetSplitResult,
  ScienceShipOrderResult,
  QueueDistrictBuildResult,
  PopulationAdjustResult,
  DistrictQueueManageResult,
  DiplomacyActionResult,
  SaveGameResult,
  LoadGameResult,
  StartSessionArgs,
} from '../slice/gameSlice';
import { gameConfig, type GameConfig } from '@config/gameConfig';
import { createSession } from '@domain/session';
import {
  advanceClock,
  setClockRunning as setClockRunningDomain,
  setClockSpeed,
} from '@domain/time/clock';
import {
  canAffordCost,
  spendResources,
} from '@domain/economy/economy';
import { createShipyardTask, advanceShipyard } from '@domain/fleet';
import { advanceFleets, calculateTravelTicks } from '@domain/fleet';
import { advanceDistrictConstruction, createDistrictConstructionTask } from '@domain/economy';
import { advanceColonization, createColonizationTask } from '@domain/session';
import { autoBalancePopulation } from '@domain/economy';
import { advanceExploration } from '@domain/galaxy';
import { advanceSimulation } from '@domain/session';
import {
  advanceDiplomacy,
  applyWarPressureToGalaxy,
  intensifyWarZones,
} from '@domain/diplomacy';
import { advanceAiWarMoves, ensureAiFleet, reinforceAiFleets } from '@domain/ai';
import { createInitialFleet, applyShipTemplate } from '@domain/fleet/ships';
import type {
  GameNotification,
  GameSession,
  GameView,
  EconomyState,
  ScienceShipStatus,
  ShipClassId,
  PopulationJobId,
  WarEventType,
  Empire,
  WarStatus,
} from '@domain/types';
import {
  appendNotification,
  appendWarEvent,
  refundResourceCost,
  updatePopulationCounts,
} from '../utils/sessionUtils';

const tickDurationMs = (cfg: GameConfig) =>
  Math.max(16, Math.round(1000 / cfg.ticksPerSecond));

export const startNewSession =
  (args?: StartSessionArgs): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const cfg = getState().game.config;
    const preset =
      (args?.presetId &&
        cfg.galaxyPresets.find((entry) => entry.id === args.presetId)) ??
      cfg.galaxyPresets.find((entry) => entry.id === 'standard') ??
      null;
    const seed = args?.seed ?? preset?.seed ?? cfg.defaultGalaxy.seed;
    const session = createSession({
      seed,
      label: args?.label,
      galaxyOverrides: {
        systemCount: preset?.systemCount ?? cfg.defaultGalaxy.systemCount,
        galaxyRadius: preset?.galaxyRadius ?? cfg.defaultGalaxy.galaxyRadius,
      },
      economyConfig: cfg.economy,
      militaryConfig: cfg.military,
      diplomacyConfig: cfg.diplomacy,
    });
    dispatch(startSessionSuccess(session));
  };

export const returnToMenu = () => returnToMenuAction();

export const setSimulationRunning =
  (isRunning: boolean, now = Date.now()): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockRunningDomain(session.clock, isRunning, now),
    };
    dispatch(setSessionState(updated));
  };

export const setSpeedMultiplier =
  (speed: number): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockSpeed(session.clock, speed),
    };
    dispatch(setSessionState(updated));
  };

export const advanceClockBy =
  (elapsedMs: number, now: number): ThunkAction<void, RootState, unknown, AnyAction> =>
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
      setSessionState({
        ...simulatedSession,
        clock: updatedClock,
      }),
    );
  };

export const startColonization =
  (systemId: string): ThunkAction<StartColonizationResult, RootState, unknown, AnyAction> =>
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
    if (system.visibility === 'unknown') {
      return { success: false, reason: 'SYSTEM_UNKNOWN' };
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
      setSessionState(
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
  (
    designId: ShipClassId,
    templateId?: string,
    customization?: {
      attackBonus: number;
      defenseBonus: number;
      hullBonus: number;
      costMultiplier: number;
      name?: string;
    },
  ): ThunkAction<QueueShipBuildResult, RootState, unknown, AnyAction> =>
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

    const template = templateId
      ? state.config.military.templates.find((entry) => entry.id === templateId)
      : undefined;
    const effectiveDesign =
      template && template.base === design.id
        ? {
            ...design,
            attack: design.attack + template.attack,
            defense: design.defense + template.defense,
            hullPoints: design.hullPoints + template.hull,
            buildCost: Object.fromEntries(
              Object.entries(design.buildCost).map(([key, value]) => [
                key,
                Math.round((value ?? 0) * template.costMultiplier),
              ]),
            ) as typeof design.buildCost,
          }
        : design;
    const customizedCost = customization
      ? Object.fromEntries(
          Object.entries(effectiveDesign.buildCost).map(([key, value]) => [
            key,
            Math.round((value ?? 0) * customization.costMultiplier),
          ]),
        )
      : effectiveDesign.buildCost;

    if (!canAffordCost(session.economy, customizedCost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(
      session.economy,
      customizedCost,
    );
    const task = createShipyardTask(
      design.id,
      design.buildTime,
      templateId,
      customization,
    );

    dispatch(
      setSessionState({
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
  ): ThunkAction<QueueDistrictBuildResult, RootState, unknown, AnyAction> =>
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
        setSessionState(
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
      setSessionState({
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
  (taskId: string): ThunkAction<DistrictQueueManageResult, RootState, unknown, AnyAction> =>
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
      setSessionState({
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
  (taskId: string): ThunkAction<DistrictQueueManageResult, RootState, unknown, AnyAction> =>
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
      setSessionState({
        ...session,
        districtConstructionQueue: queue,
      }),
    );
    return { success: true };
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

export const declareWarOnEmpire =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
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
    const sessionWithWar = appendWarEvent(
      { ...session, empires, galaxy: galaxyWithPressure },
      'warStart',
      empireId,
      currentTick,
      `Guerra dichiarata contro ${target.name}.`,
    );
    const updatedSession = appendNotification(
      sessionWithWar,
      `Guerra dichiarata contro ${target.name}.`,
      'warDeclared',
    );
    dispatch(setSessionState(updatedSession));
    return { success: true };
  };

export const proposePeaceWithEmpire =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
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
    const sessionWithWar = appendWarEvent(
      { ...session, empires },
      'warEnd',
      empireId,
      session.clock.tick,
      `Pace raggiunta con ${target.name}.`,
    );
    const updatedSession = appendNotification(
      sessionWithWar,
      `Tregua firmata con ${target.name}.`,
      'peaceAccepted',
    );
    dispatch(setSessionState(updatedSession));
    return { success: true };
  };

export const requestBorderAccess =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
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
    if (target.accessToPlayer) {
      return { success: false, reason: 'ALREADY_GRANTED' };
    }
    const updatedEmpires = session.empires.map((empire) =>
      empire.id === empireId ? { ...empire, accessToPlayer: true, opinion: empire.opinion + 5 } : empire,
    );
    dispatch(
      setSessionState(
        appendNotification(
          { ...session, empires: updatedEmpires },
          `${target.name} apre i confini.`,
          'peaceAccepted',
        ),
      ),
    );
    return { success: true };
  };

const createFleetFromShip = ({
  ship,
  systemId,
  ownerId,
}: {
  ship: GameSession['fleets'][number]['ships'][number];
  systemId: string;
  ownerId?: string;
}) => ({
  id: `FLEET-${crypto.randomUUID()}`,
  name: 'Nuova flotta',
  ownerId,
  systemId,
  targetSystemId: null,
  ticksToArrival: 0,
  ships: [ship],
});

export const orderFleetMove =
  (fleetId: string, systemId: string): ThunkAction<FleetMoveResult, RootState, unknown, AnyAction> =>
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
    if (
      system.ownerId &&
      system.ownerId !== 'player' &&
      system.ownerId.startsWith('ai')
    ) {
      const empire = session.empires.find(
        (e) => e.id === system.ownerId,
      );
      if (empire && empire.warStatus === 'peace' && !empire.accessToPlayer) {
        return { success: false, reason: 'BORDER_CLOSED' };
      }
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
      setSessionState({
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

export const mergeFleets =
  (sourceId: string, targetId: string): ThunkAction<FleetMergeResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    if (sourceId === targetId) {
      return { success: false, reason: 'SAME_FLEET' };
    }
    const source = session.fleets.find((fleet) => fleet.id === sourceId);
    const target = session.fleets.find((fleet) => fleet.id === targetId);
    if (!source) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    if (!target) {
      return { success: false, reason: 'TARGET_NOT_FOUND' };
    }
    if (source.systemId !== target.systemId) {
      return { success: false, reason: 'DIFFERENT_SYSTEM' };
    }
    const merged = session.fleets
      .filter((fleet) => fleet.id !== sourceId)
      .map((fleet) =>
        fleet.id === targetId
          ? { ...fleet, ships: [...fleet.ships, ...source.ships] }
          : fleet,
      );
    dispatch(
      setSessionState({
        ...session,
        fleets: merged,
      }),
    );
    return { success: true };
  };

export const splitFleet =
  (fleetId: string): ThunkAction<FleetSplitResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const fleet = session.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    if (fleet.ships.length <= 1) {
      return { success: false, reason: 'INSUFFICIENT_SHIPS' };
    }
    const ship = fleet.ships[fleet.ships.length - 1];
    const remaining = fleet.ships.slice(0, -1);
    const newFleet = createFleetFromShip({
      ship,
      systemId: fleet.systemId,
      ownerId: fleet.ownerId,
    });
    const updatedFleets = session.fleets.map((f) =>
      f.id === fleetId ? { ...f, ships: remaining } : f,
    );
    dispatch(
      setSessionState({
        ...session,
        fleets: [...updatedFleets, newFleet],
      }),
    );
    return { success: true, newFleetId: newFleet.id };
  };

export const orderScienceShip =
  (shipId: string, systemId: string): ThunkAction<ScienceShipOrderResult, RootState, unknown, AnyAction> =>
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
        visibility: 'revealed' as const,
      };
    });

    dispatch(
      setSessionState({
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
  (shipId: string, auto: boolean): ThunkAction<void, RootState, unknown, AnyAction> =>
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
      setSessionState({
        ...session,
        scienceShips: updatedShips,
      }),
    );
  };

export const promotePopulation =
  (planetId: string, jobId: PopulationJobId): ThunkAction<PopulationAdjustResult, RootState, unknown, AnyAction> =>
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
      setSessionState({
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
  (planetId: string, jobId: PopulationJobId): ThunkAction<PopulationAdjustResult, RootState, unknown, AnyAction> =>
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
      setSessionState({
        ...session,
        economy: {
          ...session.economy,
          planets: updatedPlanets,
        },
      }),
    );
    return { success: true };
  };

export const saveSessionToStorage =
  (): ThunkAction<SaveGameResult, RootState, unknown, AnyAction> =>
  (_dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    if (typeof localStorage === 'undefined') {
      return { success: false, reason: 'STORAGE_UNAVAILABLE' };
    }
    const payload = {
      version: 1 as const,
      savedAt: Date.now(),
      session: {
        ...session,
        clock: {
          ...session.clock,
          lastUpdate: null,
        },
      },
    };
    try {
      localStorage.setItem('fls-save-v1', JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      console.error('Failed to write save', error);
      return { success: false, reason: 'WRITE_FAILED' };
    }
  };

export const loadSessionFromStorage =
  (): ThunkAction<LoadGameResult, RootState, unknown, AnyAction> =>
  (dispatch) => {
    if (typeof localStorage === 'undefined') {
      return { success: false, reason: 'STORAGE_UNAVAILABLE' };
    }
    const raw = localStorage.getItem('fls-save-v1');
    if (!raw) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    try {
      const payload = JSON.parse(raw) as {
        version: number;
        session: GameSession;
      };
      if (payload?.version !== 1 || !payload.session) {
        return { success: false, reason: 'PARSE_ERROR' };
      }
      const hydrated: GameSession = {
        ...payload.session,
        clock: {
          ...payload.session.clock,
          lastUpdate: Date.now(),
        },
      };
      dispatch(startSessionSuccess(hydrated));
      return { success: true };
    } catch (error) {
      console.error('Failed to parse save', error);
      return { success: false, reason: 'PARSE_ERROR' };
    }
  };

export const hasSavedSession = () =>
  typeof localStorage !== 'undefined' &&
  Boolean(localStorage.getItem('fls-save-v1'));

export type {
  StartSessionArgs,
  StartColonizationResult,
  QueueShipBuildResult,
  FleetMoveResult,
  FleetMergeResult,
  FleetSplitResult,
  ScienceShipOrderResult,
  QueueDistrictBuildResult,
  PopulationAdjustResult,
  DistrictQueueManageResult,
  DiplomacyActionResult,
  SaveGameResult,
  LoadGameResult,
  GameView,
  GameConfig,
  GameSession,
  EconomyState,
};


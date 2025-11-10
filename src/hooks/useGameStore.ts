import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { useMemo } from 'react';
import type { AppDispatch, RootState } from '../store/index';
import type {
  GameSession,
  PopulationJobId,
  ShipClassId,
  ResearchBranch,
} from '@domain/types';
import type { GameConfig } from '@config/gameConfig';
import type { GameView } from '../store/slice/gameSlice';
import {
  startNewSession,
  returnToMenu,
  setSimulationRunning,
  setSpeedMultiplier,
  advanceClockBy,
  startColonization,
  queueShipBuild,
  orderFleetMove,
  orderScienceShip,
  setScienceAutoExplore,
  queueDistrictConstruction,
  promotePopulation,
  demotePopulation,
  cancelDistrictTask,
  prioritizeDistrictTask,
  declareWarOnEmpire,
  proposePeaceWithEmpire,
  requestBorderAccess,
  mergeFleets,
  splitFleet,
  saveSessionToStorage,
  loadSessionFromStorage,
  hasSavedSession,
  beginResearch,
  unlockTraditionPerk,
  resolveActiveEvent,
} from '../store/thunks';
export * from '../store/selectors';
import type {
  StartSessionArgs,
  StartColonizationResult,
  QueueShipBuildResult,
  FleetMoveResult,
  ScienceShipOrderResult,
  QueueDistrictBuildResult,
  PopulationAdjustResult,
  DistrictQueueManageResult,
  DiplomacyActionResult,
  FleetMergeResult,
  FleetSplitResult,
  SaveGameResult,
  LoadGameResult,
  StartResearchResult,
  UnlockTraditionResult,
  ResolveEventResult,
} from '../store/thunks';

export const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

interface HookState {
  view: GameView;
  config: GameConfig;
  session: GameSession | null;
  startNewSession: (args?: StartSessionArgs) => void;
  returnToMenu: () => void;
  setSimulationRunning: (isRunning: boolean, now?: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  advanceClockBy: (elapsedMs: number, now: number) => void;
  startColonization: (systemId: string) => StartColonizationResult;
  queueShipBuild: (
    designId: ShipClassId,
    templateId?: string,
    customization?: {
      attackBonus: number;
      defenseBonus: number;
      hullBonus: number;
      costMultiplier: number;
      name?: string;
    },
  ) => QueueShipBuildResult;
  orderFleetMove: (fleetId: string, systemId: string) => FleetMoveResult;
  orderScienceShip: (
    shipId: string,
    systemId: string,
  ) => ScienceShipOrderResult;
  setScienceAutoExplore: (shipId: string, auto: boolean) => void;
  queueDistrictConstruction: (
    planetId: string,
    districtId: string,
  ) => QueueDistrictBuildResult;
  promotePopulation: (
    planetId: string,
    jobId: PopulationJobId,
  ) => PopulationAdjustResult;
  demotePopulation: (
    planetId: string,
    jobId: PopulationJobId,
  ) => PopulationAdjustResult;
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
  requestBorderAccess: (empireId: string) => DiplomacyActionResult;
  mergeFleets: (sourceId: string, targetId: string) => FleetMergeResult;
  splitFleet: (fleetId: string) => FleetSplitResult;
  saveSession: () => SaveGameResult;
  loadSession: () => LoadGameResult;
  hasSavedSession: () => boolean;
  beginResearch: (branch: ResearchBranch, techId: string) => StartResearchResult;
  unlockTraditionPerk: (perkId: string) => UnlockTraditionResult;
  resolveActiveEvent: (optionId: string) => ResolveEventResult;
}

export const useGameStore = <T>(selector: (state: HookState) => T): T => {
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
      queueShipBuild: (
        designId: ShipClassId,
        templateId?: string,
        customization?: {
          attackBonus: number;
          defenseBonus: number;
          hullBonus: number;
          costMultiplier: number;
          name?: string;
        },
      ) => dispatch(queueShipBuild(designId, templateId, customization)),
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
      requestBorderAccess: (empireId: string) =>
        dispatch(requestBorderAccess(empireId)),
      mergeFleets: (sourceId: string, targetId: string) =>
        dispatch(mergeFleets(sourceId, targetId)),
      splitFleet: (fleetId: string) => dispatch(splitFleet(fleetId)),
      saveSession: () => dispatch(saveSessionToStorage()),
      loadSession: () => dispatch(loadSessionFromStorage()),
      hasSavedSession: () => hasSavedSession(),
      beginResearch: (branch: ResearchBranch, techId: string) =>
        dispatch(beginResearch(branch, techId)),
      unlockTraditionPerk: (perkId: string) =>
        dispatch(unlockTraditionPerk(perkId)),
      resolveActiveEvent: (optionId: string) =>
        dispatch(resolveActiveEvent(optionId)),
    }),
    [dispatch],
  );

  return selector({ ...state, ...actions });
};


import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { gameConfig, type GameConfig } from '../../config/gameConfig';
import type { GameSession } from '@domain/types';

export interface StartSessionArgs {
  seed?: string;
  label?: string;
  presetId?: string;
  galaxyShape?: 'circle' | 'spiral';
}

const initialState: { view: 'mainMenu' | 'simulation'; config: GameConfig; session: GameSession | null } =
  {
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

export const gameReducer = gameSlice.reducer;
export const { startSessionSuccess, returnToMenu, setSessionState } =
  gameSlice.actions;

// Re-export types used across thunks/hooks
export type GameView = 'mainMenu' | 'simulation';

export type ColonyResultReason =
  | 'NO_SESSION'
  | 'SYSTEM_NOT_FOUND'
  | 'SYSTEM_NOT_SURVEYED'
  | 'NO_HABITABLE_WORLD'
  | 'ALREADY_COLONIZED'
  | 'TASK_IN_PROGRESS'
  | 'INSUFFICIENT_RESOURCES'
  | 'NO_COLONY_SHIP'
  | 'SYSTEM_UNKNOWN';

export type BuildShipReason =
  | 'NO_SESSION'
  | 'INVALID_DESIGN'
  | 'QUEUE_FULL'
  | 'INSUFFICIENT_RESOURCES';

export type FleetOrderReason =
  | 'NO_SESSION'
  | 'FLEET_NOT_FOUND'
  | 'SYSTEM_NOT_FOUND'
  | 'ALREADY_IN_SYSTEM'
  | 'NO_SHIPS'
  | 'BORDER_CLOSED';

export type FleetManageReason =
  | 'NO_SESSION'
  | 'FLEET_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SAME_FLEET'
  | 'DIFFERENT_SYSTEM'
  | 'INSUFFICIENT_SHIPS';

export type DistrictBuildReason =
  | 'NO_SESSION'
  | 'PLANET_NOT_FOUND'
  | 'INVALID_DISTRICT'
  | 'INSUFFICIENT_RESOURCES';

export type DistrictManageReason =
  | 'NO_SESSION'
  | 'TASK_NOT_FOUND'
  | 'PLANET_NOT_FOUND';

export type PopulationAdjustReason =
  | 'NO_SESSION'
  | 'PLANET_NOT_FOUND'
  | 'INVALID_JOB'
  | 'NO_WORKERS'
  | 'NO_POPULATION';

export type DiplomacyReason =
  | 'NO_SESSION'
  | 'EMPIRE_NOT_FOUND'
  | 'INVALID_TARGET'
  | 'ALREADY_IN_STATE'
  | 'ALREADY_GRANTED';

export type SaveReason =
  | 'NO_SESSION'
  | 'STORAGE_UNAVAILABLE'
  | 'WRITE_FAILED';

export type LoadReason =
  | 'STORAGE_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'PARSE_ERROR';

export type StartColonizationResult =
  | { success: true }
  | { success: false; reason: ColonyResultReason };

export type QueueShipBuildResult =
  | { success: true }
  | { success: false; reason: BuildShipReason };

export type FleetMoveResult =
  | { success: true }
  | { success: false; reason: FleetOrderReason };

export type FleetMergeResult =
  | { success: true }
  | { success: false; reason: FleetManageReason };

export type FleetSplitResult =
  | { success: true; newFleetId: string }
  | { success: false; reason: FleetManageReason };

export type ScienceShipOrderResult =
  | { success: true }
  | { success: false; reason: 'NO_SESSION' | 'SHIP_NOT_FOUND' | 'SYSTEM_NOT_FOUND' | 'SYSTEM_UNKNOWN' };

export type QueueDistrictBuildResult =
  | { success: true }
  | { success: false; reason: DistrictBuildReason };

export type DistrictQueueManageResult =
  | { success: true }
  | { success: false; reason: DistrictManageReason };

export type PopulationAdjustResult =
  | { success: true }
  | { success: false; reason: PopulationAdjustReason };

export type RemoveDistrictReason =
  | 'NO_SESSION'
  | 'PLANET_NOT_FOUND'
  | 'INVALID_DISTRICT'
  | 'NONE_BUILT';

export type RemoveDistrictResult =
  | { success: true }
  | { success: false; reason: RemoveDistrictReason };

export type DiplomacyActionResult =
  | { success: true }
  | { success: false; reason: DiplomacyReason };

export type SaveGameResult =
  | { success: true }
  | { success: false; reason: SaveReason };

export type LoadGameResult =
  | { success: true }
  | { success: false; reason: LoadReason };

export type ResearchActionReason =
  | 'NO_SESSION'
  | 'INVALID_TECH'
  | 'PREREQ_NOT_MET'
  | 'ALREADY_COMPLETED'
  | 'BRANCH_MISMATCH';

export type StartResearchResult =
  | { success: true }
  | { success: false; reason: ResearchActionReason };

export type TraditionActionReason =
  | 'NO_SESSION'
  | 'INVALID_PERK'
  | 'ALREADY_UNLOCKED'
  | 'PREREQ_NOT_MET'
  | 'INSUFFICIENT_POINTS';

export type UnlockTraditionResult =
  | { success: true }
  | { success: false; reason: TraditionActionReason };

export type ResolveEventReason =
  | 'NO_SESSION'
  | 'NO_EVENT'
  | 'OPTION_NOT_FOUND'
  | 'INSUFFICIENT_RESOURCES';

export type ResolveEventResult =
  | { success: true }
  | { success: false; reason: ResolveEventReason };

export type PopulationJobId =
  | 'workers'
  | 'specialists'
  | 'researchers';

export type ShipClassId = 'corvette' | 'frigate' | 'colony';


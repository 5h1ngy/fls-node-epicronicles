import type {
  GameSession,
  GameNotification,
  CombatResultType,
  GalaxyState,
} from '@domain/types';
import type { GameConfig } from '@config/gameConfig';
import { advanceExploration } from '@domain/galaxy/exploration';
import { advanceEconomy } from '@domain/economy/economy';
import { advanceColonization } from './colonization';
import { advanceShipyard } from '@domain/fleet/shipyard';
import { advanceFleets } from '@domain/fleet/fleets';
import { advanceDistrictConstruction } from '@domain/economy/districts';
import { autoBalancePopulation } from '@domain/economy/population';
import { advanceResearch } from '@domain/research/research';
import { advanceTraditions } from '@domain/traditions/traditions';
import { deriveProgressionModifiers } from '@domain/progression/modifiers';
import {
  advanceDiplomacy,
  applyWarPressureToGalaxy,
  intensifyWarZones,
  assignBordersToPlayer,
} from '@domain/diplomacy/diplomacy';
import { advanceAiWarMoves, ensureAiFleet, reinforceAiFleets } from '@domain/ai/ai';
import { calculatePlayerFleetPower } from '@domain/fleet/fleets';

const assignAiExpansion = (
  galaxy: GalaxyState,
  empires: GameSession['empires'],
): GalaxyState => {
  const ai = empires.find((empire) => empire.kind === 'ai');
  if (!ai) {
    return galaxy;
  }
  const target = galaxy.systems.find(
    (system) =>
      !system.ownerId &&
      system.habitableWorld &&
      (system.hostilePower ?? 0) === 0,
  );
  if (!target) {
    return galaxy;
  }
  const systems = galaxy.systems.map((system) =>
    system.id === target.id ? { ...system, ownerId: ai.id } : system,
  );
  return { ...galaxy, systems };
};

const combatResultLabel: Record<CombatResultType, string> = {
  playerVictory: 'Vittoria',
  playerDefeat: 'Sconfitta',
  mutualDestruction: 'Mutua distruzione',
  stalemate: 'Stallo',
};

export const advanceSimulation = (
  session: GameSession,
  ticks: number,
  config: GameConfig,
): GameSession => {
  if (ticks <= 0) {
    return session;
  }

  let updatedSession = session;

  for (let iteration = 0; iteration < ticks; iteration += 1) {
    const iterationNotifications: GameNotification[] = [];
    const iterationWarEvents: GameSession['warEvents'] = [
      ...updatedSession.warEvents,
    ];
    const progressionModifiers = deriveProgressionModifiers({
      research: updatedSession.research,
      traditions: updatedSession.traditions,
      researchConfig: config.research,
      traditionConfig: config.traditions,
    });
    const fallbackSystemId =
      updatedSession.fleets[0]?.systemId ??
      updatedSession.galaxy.systems[0]?.id ??
      'unknown';
    const currentTick = updatedSession.clock.tick + iteration + 1;
    updatedSession = ensureAiFleet(
      updatedSession,
      config.military,
      config.diplomacy,
    );
    updatedSession = reinforceAiFleets(
      updatedSession,
      config.military,
      config.diplomacy,
    );
    const colonization = advanceColonization(
      updatedSession.colonizationTasks,
      updatedSession.economy,
      config.colonization,
    );
    let workingGalaxy = updatedSession.galaxy;
    const colonizedSystems = new Set(
      colonization.economy.planets.map((planet) => planet.systemId),
    );
    colonization.completed.forEach((entry) => colonizedSystems.add(entry.systemId));
    if (colonizedSystems.size > 0) {
      workingGalaxy = assignBordersToPlayer(workingGalaxy, colonizedSystems);
    }
    workingGalaxy = assignAiExpansion(workingGalaxy, updatedSession.empires);
    const districtConstruction = advanceDistrictConstruction({
      tasks: updatedSession.districtConstructionQueue,
      economy: colonization.economy,
    });
    if (colonization.completed.length > 0) {
      colonization.completed.forEach((entry) => {
        iterationNotifications.push({
          id: `notif-${crypto.randomUUID()}`,
          tick: updatedSession.clock.tick + iteration + 1,
          kind: 'colonizationCompleted',
          message: `Colonia fondata in ${entry.planetName} (${entry.systemId}).`,
        });
      });
    }
    if (districtConstruction.completed.length > 0) {
      districtConstruction.completed.forEach((task) => {
        const planet = districtConstruction.economy.planets.find(
          (entry) => entry.id === task.planetId,
        );
        const district = config.economy.districts.find(
          (definition) => definition.id === task.districtId,
        );
        iterationNotifications.push({
          id: `notif-${crypto.randomUUID()}`,
          tick: updatedSession.clock.tick + iteration + 1,
          kind: 'districtComplete',
          message: `Distretto ${district?.label ?? task.districtId} completato su ${planet?.name ?? task.planetId}`,
        });
      });
    }
    const shipyard = advanceShipyard({
      tasks: updatedSession.shipyardQueue,
      fleets: updatedSession.fleets,
      military: config.military,
      fallbackSystemId,
    });
    const fleetsAdvance = advanceFleets({
      fleets: shipyard.fleets,
      galaxy: workingGalaxy,
      config,
      fallbackSystemId,
      tick: currentTick,
    });
    if (fleetsAdvance.reports.length > 0) {
      fleetsAdvance.reports.forEach((report) => {
        const systemName =
          fleetsAdvance.galaxy.systems.find(
            (system) => system.id === report.systemId,
          )?.name ?? report.systemId;
        const resultLabel =
          combatResultLabel[report.result] ?? report.result;
        iterationNotifications.push({
          id: `notif-${crypto.randomUUID()}`,
          tick: report.tick,
          kind: 'combatReport',
          message: `Combattimento a ${systemName}: ${resultLabel} (forza ${report.playerPower} vs ${report.hostilePower}).`,
        });
      });
    }
    if (fleetsAdvance.hostilesCleared.length > 0) {
      fleetsAdvance.hostilesCleared.forEach((systemId) => {
        const systemName =
          fleetsAdvance.galaxy.systems.find(
            (system) => system.id === systemId,
          )?.name ?? systemId;
        iterationNotifications.push({
          id: `notif-${crypto.randomUUID()}`,
          tick: currentTick,
          kind: 'combatReport',
          message: `Minaccia neutralizzata in ${systemName}.`,
        });
      });
    }
    const diplomacy = advanceDiplomacy({
      empires: updatedSession.empires,
      config: config.diplomacy,
      tick: currentTick,
      playerFleetPower: calculatePlayerFleetPower(
        fleetsAdvance.fleets,
        config,
      ),
    });
    if (diplomacy.notifications.length > 0) {
      iterationNotifications.push(...diplomacy.notifications);
    }
    if (diplomacy.warsStarted.length > 0) {
      diplomacy.warsStarted.forEach((empireId) => {
        iterationWarEvents.push({
          id: `war-${crypto.randomUUID()}`,
          type: 'warStart',
          empireId,
          tick: currentTick,
          message: 'Guerra dichiarata.',
        });
      });
    }
    if (diplomacy.warsEnded.length > 0) {
      diplomacy.warsEnded.forEach((empireId) => {
        iterationWarEvents.push({
          id: `war-${crypto.randomUUID()}`,
          type: 'warEnd',
          empireId,
          tick: currentTick,
          message: 'Pace raggiunta.',
        });
      });
    }
    const galaxyWithWarZones = applyWarPressureToGalaxy({
      galaxy: fleetsAdvance.galaxy,
      warsStarted: diplomacy.warsStarted,
      tick: currentTick,
      config: config.diplomacy.warZones,
    });
    const warZoneGalaxy = intensifyWarZones({
      galaxy: galaxyWithWarZones,
      empires: diplomacy.empires,
      tick: currentTick,
      config: config.diplomacy.warZones,
    });
    const sessionWithAiOrders = advanceAiWarMoves({
      session: { ...updatedSession, fleets: fleetsAdvance.fleets, galaxy: warZoneGalaxy },
      military: config.military,
    });
    const { galaxy, scienceShips } = advanceExploration(
      warZoneGalaxy,
      updatedSession.scienceShips,
      config.exploration,
    );
    const balancedEconomy = autoBalancePopulation({
      economy: districtConstruction.economy,
      config: config.economy,
    });
    const { economy, netProduction } = advanceEconomy(
      balancedEconomy,
      config.economy,
      progressionModifiers,
    );
    const researchAdvance = advanceResearch({
      state: updatedSession.research,
      researchIncome: Math.max(0, netProduction.research),
      config: config.research,
    });
    const traditions = advanceTraditions({
      state: updatedSession.traditions,
      influenceIncome: Math.max(0, netProduction.influence),
      config: config.traditions,
    });
    if (researchAdvance.completed.length > 0) {
      researchAdvance.completed.forEach((tech) => {
        iterationNotifications.push({
          id: `notif-tech-${tech.id}-${currentTick}`,
          tick: currentTick,
          kind: 'combatReport',
          message: `Ricerca completata: ${tech.name}.`,
        });
      });
    }

    updatedSession = {
      ...updatedSession,
      galaxy,
      scienceShips,
      empires: diplomacy.empires,
      research: researchAdvance.research,
      traditions,
      warEvents: iterationWarEvents.slice(
        -config.diplomacy.warEventLogLimit,
      ),
      colonizationTasks: colonization.tasks,
      districtConstructionQueue: districtConstruction.tasks,
      shipyardQueue: shipyard.tasks,
      fleets: sessionWithAiOrders.fleets,
      combatReports: [
        ...updatedSession.combatReports,
        ...fleetsAdvance.reports,
      ].slice(-8),
      notifications: [
        ...updatedSession.notifications,
        ...iterationNotifications,
      ].slice(-6),
      economy,
    };
  }

  return updatedSession;
};





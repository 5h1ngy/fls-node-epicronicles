import { useEffect } from 'react';
import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { disposeNebula } from '../scene/background';
import { rebuildSceneGraph } from '../scene/rebuildScene';
import { createAnchorResolver } from '../scene/anchors';
import { useGalaxyMapContext } from './GalaxyMapContext';

export interface UseSceneRebuildParams {
  systems: StarSystem[];
  galaxyShape: 'circle' | 'spiral';
  galaxySeed: string;
  maxSystemRadius: number;
  orbitBaseSpeed: number;
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<string, unknown>;
  scienceShips: ScienceShip[];
  fleets: Fleet[];
  empireWar: boolean;
  systemsSignature: string;
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  fleetMaterials: Record<string, THREE.Material>;
}

export const useSceneRebuild = ({
  systems,
  galaxyShape,
  galaxySeed,
  maxSystemRadius,
  orbitBaseSpeed,
  colonizedLookup,
  recentCombatSystems,
  activeBattles,
  starVisuals,
  scienceShips,
  fleets,
  empireWar,
  systemsSignature,
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
}: UseSceneRebuildParams) => {
  const {
    sceneContext,
    refs: {
      systemGroupRef,
      systemPositionRef,
      planetAngleRef,
      planetLookupRef,
      systemsSignatureRef,
      nebulaRef,
      blackHoleRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      anchorResolverRef,
    },
  } = useGalaxyMapContext();
  useEffect(() => {
    const group = systemGroupRef.current;
    if (!sceneContext || !group) {
      return;
    }

    if (systemsSignatureRef.current === systemsSignature) {
      return;
    }
    systemsSignatureRef.current = systemsSignature;

    if (nebulaRef.current) {
      disposeNebula(nebulaRef.current);
      nebulaRef.current = null;
    }

    group.children.forEach((child) => {
      const orbit = child.getObjectByName('orbits') as THREE.Group | null;
      if (!orbit) {
        return;
      }
      orbit.children.forEach((entry) => {
        const planetId = entry.userData?.planetId as string | undefined;
        if (
          planetId &&
          typeof entry.userData?.orbitAngle === 'number'
        ) {
          planetAngleRef.current.set(planetId, entry.userData.orbitAngle);
        }
      });
    });

    group.clear();
    planetLookupRef.current.clear();

    const resolverForBuild =
      anchorResolverRef.current ??
      createAnchorResolver(systemPositionRef.current, planetLookupRef.current);

    const { nebula, positions, updateAnchorInstances } = rebuildSceneGraph({
      group,
      systems,
      galaxyShape,
      galaxySeed,
      maxSystemRadius,
      orbitBaseSpeed,
      colonizedLookup,
      recentCombatSystems,
      activeBattles,
      starVisuals,
      scienceShips,
      fleets,
      empireWar,
      planetAngleRef: planetAngleRef.current,
      planetLookupRef: planetLookupRef.current,
      scienceMaterials,
      scienceLineMaterials,
      fleetMaterials,
      scienceAnchorsRef: scienceAnchorsRef.current,
      fleetAnchorsRef: fleetAnchorsRef.current,
      getVector: resolverForBuild.getVector,
      releaseVector: resolverForBuild.releaseVector,
      getMatrix: resolverForBuild.getMatrix,
      releaseMatrix: resolverForBuild.releaseMatrix,
    });

    nebulaRef.current = nebula;
    systemPositionRef.current = positions;
    anchorResolverRef.current = createAnchorResolver(
      systemPositionRef.current,
      planetLookupRef.current,
    );
    if (blackHoleRef.current) {
      blackHoleRef.current.position.set(0, 0, 0);
      group.add(blackHoleRef.current);
    }

    updateAnchorInstances();
  }, [
    sceneContext,
    systems,
    galaxyShape,
    galaxySeed,
    maxSystemRadius,
    orbitBaseSpeed,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals,
    scienceShips,
    fleets,
    empireWar,
    systemsSignature,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    anchorResolverRef,
    systemGroupRef,
    systemPositionRef,
    planetAngleRef,
    planetLookupRef,
    systemsSignatureRef,
    nebulaRef,
    blackHoleRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
  ]);
};

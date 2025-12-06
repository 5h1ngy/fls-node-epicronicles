import { useEffect } from 'react';
import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { rebuildScene } from '../entities/Scene';
import { AnchorsResolver } from '../entities/Anchors';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';

export interface UseSceneRebuildParams {
  systems: StarSystem[];
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
  shipDesignLookup: Map<string, import('@domain/types').ShipDesign>;
}

const disposeObjectResources = (object: THREE.Object3D) => {
  const mesh = object as THREE.Mesh;
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
  if (material) {
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((mat) => {
      // @ts-expect-error allow optional texture cleanup
      if (mat.map?.dispose) mat.map.dispose();
      if (mat instanceof THREE.Material) {
        mat.dispose();
      }
    });
  }
};

const preserveStarRotations = (group: THREE.Group) => {
  const map = new Map<string, number>();
  group.children.forEach((child) => {
    const systemId = child.userData?.systemId as string | undefined;
    if (!systemId) {
      return;
    }
    const starGroup = child.getObjectByName('starVisual') as THREE.Group | null;
    if (starGroup) {
      map.set(systemId, starGroup.rotation.y);
    }
  });
  return map;
};

const disposeGroupResources = (group: THREE.Group) => {
  group.traverse((child) => {
    if (child !== group) {
      disposeObjectResources(child);
    }
  });
  group.clear();
};

export const useSceneRebuild = ({
  systems,
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
  shipDesignLookup,
}: UseSceneRebuildParams) => {
  const {
    sceneContext,
    cameraState: { systemGroupRef },
    anchorState: {
      systemPositionRef,
      systemsSignatureRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      anchorResolverRef,
    },
  } = useGalaxyMapContext();
  useEffect(() => {
    const group = systemGroupRef.current ?? sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return;
    }

    if (systemsSignatureRef.current === systemsSignature) {
      return;
    }
    systemsSignatureRef.current = systemsSignature;

    const starRotations = preserveStarRotations(group);

    disposeGroupResources(group);

    const resolverForBuild =
      anchorResolverRef.current ??
      new AnchorsResolver(systemPositionRef.current);

    const { positions, updateAnchorInstances } = rebuildScene({
      group,
      systems,
      colonizedLookup,
      recentCombatSystems,
      activeBattles,
      starVisuals,
      scienceShips,
      fleets,
      empireWar,
      scienceMaterials,
      scienceLineMaterials,
      fleetMaterials,
      scienceAnchorsRef: scienceAnchorsRef.current,
      fleetAnchorsRef: fleetAnchorsRef.current,
      getVector: resolverForBuild.getVector.bind(resolverForBuild),
      releaseVector: resolverForBuild.releaseVector.bind(resolverForBuild),
      getMatrix: resolverForBuild.getMatrix.bind(resolverForBuild),
      releaseMatrix: resolverForBuild.releaseMatrix.bind(resolverForBuild),
      shipDesignLookup,
      starRotations,
    });

    systemPositionRef.current = positions;
    anchorResolverRef.current = new AnchorsResolver(systemPositionRef.current);

    updateAnchorInstances();
  }, [
    sceneContext,
    systems,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals,
    scienceShips,
    fleets,
    shipDesignLookup,
    empireWar,
    systemsSignature,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    anchorResolverRef,
    systemGroupRef,
    systemPositionRef,
    systemsSignatureRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
  ]);
};

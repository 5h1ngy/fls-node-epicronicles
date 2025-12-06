import * as THREE from 'three';
import type { Fleet, ShipDesign } from '@domain/types';
import type { AnchorEntry } from './Anchors';
import { SpaceshipsBase } from './SpaceshipsBase';

interface FleetAnchorParams {
  group: THREE.Group;
  fleets: Fleet[];
  positions: Map<string, THREE.Vector3>;
  empireWar: boolean;
  fleetAnchorsRef: AnchorEntry[];
  fleetMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
  shipDesignLookup: Map<string, ShipDesign>;
}

const isConstructionFleet = (
  fleet: Fleet,
  designLookup: Map<string, ShipDesign>,
) =>
  fleet.ships.some(
    (ship) => designLookup.get(ship.designId)?.role === 'construction',
  );

export class MilitarySpaceships extends SpaceshipsBase {
  private fleetAnchorsRef: AnchorEntry[] = [];
  private fleetMaterials: Record<string, THREE.Material> = {};
  private shipDesignLookup: Map<string, ShipDesign> = new Map();

  setup({
    fleetAnchorsRef,
    fleetMaterials,
    shipDesignLookup,
  }: Pick<FleetAnchorParams, 'fleetAnchorsRef' | 'fleetMaterials' | 'shipDesignLookup'>) {
    this.fleetAnchorsRef = fleetAnchorsRef;
    this.fleetMaterials = fleetMaterials;
    this.shipDesignLookup = shipDesignLookup;
  }

  rebuild({
    group,
    fleets,
    empireWar,
  }: Pick<FleetAnchorParams, 'group' | 'fleets' | 'empireWar'>) {
    const fleetTargetGroup = new THREE.Group();
    fleetTargetGroup.name = 'fleetTargets';
    const fleetGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const fleetTargetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.fleetAnchorsRef.length = 0;

    (['idle', 'war'] as const).forEach((status) => {
      const list = fleets.filter(() =>
        status === 'war' ? empireWar : !empireWar,
      );
      if (list.length === 0) {
        return;
      }
      const regularFleets = list.filter(
        (fleet) => !isConstructionFleet(fleet, this.shipDesignLookup),
      );

      if (regularFleets.length > 0) {
        const material =
          status === 'war' ? this.fleetMaterials.war : this.fleetMaterials.idle;
        const mesh = new THREE.InstancedMesh(
          fleetGeometry,
          material,
          regularFleets.length,
        );
        mesh.userData = { entityKind: 'fleet', instances: regularFleets };
        regularFleets.forEach((fleet, idx) => {
          this.fleetAnchorsRef.push({
            mesh,
            index: idx,
            systemId: fleet.systemId,
            height: 5,
          });
          if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
            const lineMaterial =
              status === 'war' ? this.fleetMaterials.warLine : this.fleetMaterials.line;
            const targetMaterial =
              status === 'war' ? this.fleetMaterials.war : this.fleetMaterials.idle;
            this.createTravelPath({
              group: fleetTargetGroup,
              fromSystemId: fleet.systemId,
              toSystemId: fleet.targetSystemId,
              lineMaterial,
              targetGeometry: fleetTargetGeometry,
              targetMaterial,
              targetHeight: 1.5,
            });
          }
        });
        mesh.instanceMatrix.needsUpdate = true;
        group.add(mesh);
      }
    });

    group.add(fleetTargetGroup);
    return fleetTargetGroup;
  }
}

export const buildMilitaryAnchors = (params: FleetAnchorParams) => {
  const builder = new MilitarySpaceships(
    params.positions,
    params.getVector,
    params.releaseVector,
  );
  builder.setup({
    fleetAnchorsRef: params.fleetAnchorsRef,
    fleetMaterials: params.fleetMaterials,
    shipDesignLookup: params.shipDesignLookup,
  });
  return builder.rebuild({
    group: params.group,
    fleets: params.fleets,
    empireWar: params.empireWar,
  });
};

import * as THREE from 'three';

export const materialCache = {
  friendly: new THREE.MeshStandardMaterial({ color: 0x74b0ff }),
  hostile: new THREE.MeshStandardMaterial({ color: 0xff6b6b }),
  revealed: new THREE.MeshStandardMaterial({
    color: 0x4c5e82,
    emissive: 0x05070d,
    transparent: true,
    opacity: 0.8,
  }),
  fogged: new THREE.MeshStandardMaterial({
    color: 0x1a2132,
    emissive: 0x05070d,
    transparent: true,
    opacity: 0.5,
  }),
  ship: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

export const scienceMaterials: Record<
  'idle' | 'traveling' | 'surveying',
  THREE.Material
> = {
  idle: new THREE.MeshBasicMaterial({ color: 0x7fe38f }),
  traveling: new THREE.MeshBasicMaterial({ color: 0xffc857 }),
  surveying: new THREE.MeshBasicMaterial({ color: 0x4de2ff }),
};

export const scienceLineMaterials: Record<
  'idle' | 'traveling' | 'surveying',
  THREE.LineBasicMaterial
> = {
  idle: new THREE.LineBasicMaterial({
    color: 0x7fe38f,
    transparent: true,
    opacity: 0.35,
  }),
  traveling: new THREE.LineBasicMaterial({
    color: 0xffc857,
    transparent: true,
    opacity: 0.45,
  }),
  surveying: new THREE.LineBasicMaterial({
    color: 0x4de2ff,
    transparent: true,
    opacity: 0.45,
  }),
};

export const fleetMaterials = {
  idle: new THREE.MeshBasicMaterial({ color: 0x9fc1ff }),
  line: new THREE.LineBasicMaterial({
    color: 0x9fc1ff,
    transparent: true,
    opacity: 0.4,
  }),
  war: new THREE.MeshBasicMaterial({ color: 0xff9b8a }),
  warLine: new THREE.LineBasicMaterial({
    color: 0xff9b8a,
    transparent: true,
    opacity: 0.5,
  }),
};

export const hostileIndicatorMaterial = new THREE.MeshBasicMaterial({
  color: 0xff6b6b,
  transparent: true,
  opacity: 0.6,
});

export const combatIndicatorMaterial = new THREE.MeshBasicMaterial({
  color: 0xffc857,
  transparent: true,
  opacity: 0.7,
});

export const battleIconMaterial = new THREE.MeshBasicMaterial({
  color: 0xff6b6b,
  transparent: true,
  opacity: 0.9,
});

export const ownerMaterials: Record<string, THREE.MeshBasicMaterial> = {
  player: new THREE.MeshBasicMaterial({
    color: 0x6fa8ff,
    transparent: true,
    opacity: 0.4,
  }),
  ai: new THREE.MeshBasicMaterial({
    color: 0xffc857,
    transparent: true,
    opacity: 0.35,
  }),
};

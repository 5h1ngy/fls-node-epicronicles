import { AdditiveBlending, ShaderMaterial, Vector3, Color } from 'three';
import type { StarClass, StarSystem } from '@domain/types';
import { materialCache } from '@three/materials';
import { getStarCoreTexture } from './starTextures';

type StarVisual = {
  coreColor: string;
  glowColor: string;
  coreRadius: number;
  glowScale: number;
  plasmaSpeed: number;
  jetIntensity: number;
  streakOpacity: number;
};

const fallbackStarVisuals: Record<StarClass, StarVisual> = {
  O: {
    coreColor: '#b9d8ff',
    glowColor: '#7ecbff',
    coreRadius: 6.5,
    glowScale: 22,
    plasmaSpeed: 1.4,
    jetIntensity: 0.32,
    streakOpacity: 0.2,
  },
  B: {
    coreColor: '#9fc4ff',
    glowColor: '#7ac8ff',
    coreRadius: 5.8,
    glowScale: 19.5,
    plasmaSpeed: 1.25,
    jetIntensity: 0.28,
    streakOpacity: 0.18,
  },
  A: {
    coreColor: '#c7d6ff',
    glowColor: '#9cc5ff',
    coreRadius: 5.0,
    glowScale: 17.5,
    plasmaSpeed: 1.1,
    jetIntensity: 0.22,
    streakOpacity: 0.16,
  },
  F: {
    coreColor: '#f7f2d0',
    glowColor: '#ffd27a',
    coreRadius: 4.6,
    glowScale: 16.2,
    plasmaSpeed: 1.05,
    jetIntensity: 0.2,
    streakOpacity: 0.15,
  },
  G: {
    coreColor: '#ffd27a',
    glowColor: '#ffbe55',
    coreRadius: 4.2,
    glowScale: 14.5,
    plasmaSpeed: 1,
    jetIntensity: 0.18,
    streakOpacity: 0.14,
  },
  K: {
    coreColor: '#ffb36b',
    glowColor: '#ff9b5f',
    coreRadius: 3.6,
    glowScale: 12.5,
    plasmaSpeed: 0.95,
    jetIntensity: 0.16,
    streakOpacity: 0.12,
  },
  M: {
    coreColor: '#ff8a5c',
    glowColor: '#ff6b5f',
    coreRadius: 3.2,
    glowScale: 10.8,
    plasmaSpeed: 0.9,
    jetIntensity: 0.14,
    streakOpacity: 0.1,
  },
};

const createStarCoreMaterial = ({
  preset,
  visibility,
  seed,
}: {
  preset: StarVisual;
  visibility: StarSystem['visibility'];
  seed: number;
}) => {
  if (visibility === 'unknown') {
    return materialCache.fogged;
  }
  const texture = getStarCoreTexture();
  const tint = new Color(preset.coreColor);
  const tintVec = new Vector3(tint.r, tint.g, tint.b);
  return new ShaderMaterial({
    transparent: true,
    depthWrite: true,
    blending: AdditiveBlending,
    uniforms: {
      uTexture: { value: texture },
      uTint: { value: tintVec },
      uGlow: { value: 1.2 },
      uFresnelPower: { value: 2.8 },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uSpeed: { value: preset.plasmaSpeed },
      uJetIntensity: { value: preset.jetIntensity },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform sampler2D uTexture;
      uniform vec3 uTint;
      uniform float uGlow;
      uniform float uFresnelPower;
      uniform float uTime;
      uniform float uSeed;
      uniform float uSpeed;
      uniform float uJetIntensity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.7;
        float freq = 1.6;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p * freq);
          freq *= 2.05;
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 uvCentered = vUv - 0.5;
        float time = uTime * uSpeed;
        vec2 warped = uvCentered + fbm(uvCentered * 5.2 + time * 0.28 + uSeed) * 0.06;
        vec3 tex = texture2D(uTexture, warped + 0.5).rrr;
        float plasma = fbm(warped * 9.0 + time * 0.26) * 0.95 + fbm((warped + vec2(0.28, -0.18)) * 5.4 - time * 0.18) * 0.8;
        float angle = atan(uvCentered.y, uvCentered.x);
        float jetBurst = sin(time * 0.65 + uSeed * 3.7) * 0.5 + 0.5;
        float jets = pow(max(0.0, sin(angle * 6.2 + uSeed * 12.0 + time * 0.92)), 3.0) * jetBurst;
        jets *= smoothstep(0.2, 0.75, length(uvCentered)) * uJetIntensity;
        plasma += jets * 0.5;
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uFresnelPower);
        float plasmaMask = clamp(plasma, 0.0, 1.0);
        vec3 color = (tex * 0.9 + plasmaMask * 0.6 + jets * 0.35) * uTint * (0.88 + uGlow * 0.6) + fresnel * vec3(1.0, 1.0, 1.0);
        float alpha = clamp(max(max(tex.r, plasmaMask), fresnel) + jets * 0.3, 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    name: 'starCoreMaterial',
  });
};

export type { StarVisual };
export { fallbackStarVisuals, createStarCoreMaterial };

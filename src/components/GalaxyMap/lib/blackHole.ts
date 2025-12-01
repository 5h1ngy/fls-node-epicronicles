import * as THREE from 'three';

export const createBlackHole = () => {
  const group = new THREE.Group();
  group.name = 'blackHole';

  const shaderMaterials: THREE.ShaderMaterial[] = [];

  const diskTilt = 0;

  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      depthWrite: true,
    }),
  );
  group.add(horizon);

  const diskShader = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vec2 uv = vUv - 0.5;
        float r = length(uv);
        float angle = atan(uv.y, uv.x);

        float inner = smoothstep(0.12, 0.16, r);
        float outer = 1.0 - smoothstep(0.56, 0.62, r);
        float disc = inner * outer;

        float beaming = 0.6 + 0.4 * cos(angle - uTime * 0.9);
        float swirl = sin(r * 32.0 - uTime * 2.5 + sin(angle * 6.0) * 0.4) * 0.03;
        float band = exp(-pow((r - 0.24 + swirl) * 16.0, 2.0));

        vec3 warm = vec3(1.15, 0.95, 0.8);
        vec3 cool = vec3(0.45, 0.65, 1.0);
        vec3 color = mix(cool, warm, 0.55 + 0.45 * beaming);
        color *= band * disc * 0.6;

        float alpha = clamp(disc * (0.2 + 0.2 * band), 0.0, 0.6);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  shaderMaterials.push(diskShader);

  const accretionMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vec2 uv = vUv - 0.5;
        float r = length(uv);
        float angle = atan(uv.y, uv.x);

        float inner = smoothstep(0.14, 0.18, r);
        float outer = 1.0 - smoothstep(0.48, 0.52, r);
        float disc = inner * outer;

        float beaming = 0.6 + 0.4 * cos(angle - uTime * 0.8);
        float swirl = sin(r * 28.0 - uTime * 2.0) * 0.2;
        float band = exp(-pow((r - 0.28 + swirl * 0.01) * 10.0, 2.0));

        vec3 warm = vec3(1.2, 1.0, 0.85);
        vec3 cool = vec3(0.4, 0.6, 1.0);
        vec3 color = mix(cool, warm, 0.65 + 0.35 * beaming);
        color *= band * disc * 0.55;

        float glow = 1.0 - smoothstep(0.5, 0.9, r);
        color += vec3(0.1, 0.15, 0.25) * glow * 0.4;

        float alpha = clamp(disc * 0.8, 0.0, 0.5) * (0.25 + 0.35 * band);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  shaderMaterials.push(accretionMaterial);

  const accretionDisk = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200, 1, 1),
    diskShader,
  );
  accretionDisk.name = 'accretionOuter';
  accretionDisk.rotation.set(diskTilt, 0, 0);
  group.add(accretionDisk);

  const hotDisk = new THREE.Mesh(
    new THREE.PlaneGeometry(170, 170, 1, 1),
    accretionMaterial,
  );
  hotDisk.name = 'accretionInner';
  hotDisk.rotation.set(diskTilt, 0, 0);
  hotDisk.position.set(0, 0, 0.15);
  group.add(hotDisk);

  const lensMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vec2 uv = vUv - 0.5;
        float r = length(uv);
        float ring = smoothstep(0.32, 0.34, r) * (1.0 - smoothstep(0.38, 0.42, r));
        float pulse = 0.75 + 0.25 * sin(uTime * 1.2 + r * 8.0);
        vec3 color = mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.9, 0.8), ring) * pulse;
        gl_FragColor = vec4(color, ring * 0.6);
      }
    `,
  });
  shaderMaterials.push(lensMaterial);

  const lensRing = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220, 1, 1),
    lensMaterial,
  );
  lensRing.name = 'glow';
  lensRing.rotation.set(diskTilt, 0, 0);
  lensRing.position.set(0, 0, 0.2);
  group.add(lensRing);

  group.userData.shaderMaterials = shaderMaterials;
  return group;
};

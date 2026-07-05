"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type TurtleState = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  progress: number;
};

const MOBILE_BREAKPOINT = 768;
const VERY_SMALL_SCREEN = 380;

export default function BioluminescentTree() {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isVerySmallScreen =
      Math.min(window.innerWidth, window.innerHeight) < VERY_SMALL_SCREEN;

    if (prefersReducedMotion || isVerySmallScreen) return;

    let animationFrame = 0;
    let disposed = false;
    let treeMesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> | null =
      null;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const settings = {
      iterations: isMobile ? 9 : 13,
      rules: {
        X: "F[-FY][+FY]",
        Y: "F[&FX][^FX]",
      } as Record<string, string>,
      axiom: "FFFX",
      lightColor: new THREE.Color("#b91c1c"),
      branchBaseColor: new THREE.Color("#030101"),
      flowSpeed: isMobile ? 0.72 : 0.95,
      pulseWidth: 1.15,
      pulseInterval: 3.25,
      minAngle: 15,
      maxAngle: 35,
      coneFactor: 0.9,
      initialLength: isMobile ? 0.74 : 0.8,
      minLengthFactor: 0.2,
      maxLengthFactor: 0.8,
      initialThickness: isMobile ? 0.58 : 0.72,
      thicknessFactor: 0.9,
    };

    let lSystem = settings.axiom;
    for (let index = 0; index < settings.iterations; index++) {
      lSystem = lSystem
        .split("")
        .map((character) => settings.rules[character] ?? character)
        .join("");
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050101");

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1000);
    camera.position.set(0, 1.2, isMobile ? 18 : 16);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x050101, 0);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobile ? 1.15 : 1.5)
    );
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.width = "100%";
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uFlowSpeed: { value: settings.flowSpeed },
        uPulseWidth: { value: settings.pulseWidth },
        uPulseInterval: { value: settings.pulseInterval },
        uLightColor: { value: settings.lightColor },
        uBaseColor: { value: settings.branchBaseColor },
        uGlowBoost: { value: 1.0 },
      },
      vertexShader: `
        attribute float aProgress;
        varying float vProgress;
        varying vec3 vNormal;

        void main() {
          vProgress = aProgress;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uPulseWidth;
        uniform float uPulseInterval;
        uniform vec3 uLightColor;
        uniform vec3 uBaseColor;
        uniform float uGlowBoost;
        varying float vProgress;
        varying vec3 vNormal;

        void main() {
          float wave = mod(vProgress - uTime * uFlowSpeed, uPulseInterval);
          float pulse = smoothstep(uPulseInterval - uPulseWidth, uPulseInterval, wave);
          float rim = pow(1.0 - abs(vNormal.z), 1.8) * 0.35;
          vec3 finalColor = mix(uBaseColor, uLightColor * (2.0 + uGlowBoost), pulse + rim);
          gl_FragColor = vec4(finalColor, 0.82);
        }
      `,
    });

    function resize() {
      if (!container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function randomAngle() {
      return THREE.MathUtils.degToRad(
        THREE.MathUtils.randFloat(settings.minAngle, settings.maxAngle)
      );
    }

    function createSegment(
      position: THREE.Vector3,
      direction: THREE.Vector3,
      progress: number
    ) {
      const lengthFactor = Math.max(
        0.2,
        1 - progress * THREE.MathUtils.randFloat(settings.minLengthFactor, settings.maxLengthFactor)
      );
      const currentLength = settings.initialLength * lengthFactor;
      const nextPosition = position.clone().addScaledVector(direction, currentLength);
      const distance = position.distanceTo(nextPosition);
      const radiusFactor = Math.max(0.1, 1 - progress * settings.thicknessFactor);
      const radius = settings.initialThickness * radiusFactor;
      const geometry = new THREE.CylinderGeometry(
        radius * settings.coneFactor,
        radius,
        distance,
        isMobile ? 5 : 6
      );

      geometry.translate(0, distance / 2, 0);
      geometry.rotateX(Math.PI / 2);
      geometry.applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          direction.clone().normalize()
        )
      );
      geometry.translate(position.x, position.y, position.z);
      geometry.setAttribute(
        "aProgress",
        new THREE.BufferAttribute(
          new Float32Array(geometry.attributes.position.count).fill(progress),
          1
        )
      );

      return { geometry, nextPosition };
    }

    function generateTree() {
      const geometries: THREE.BufferGeometry[] = [];
      const stack: TurtleState[] = [];
      const position = new THREE.Vector3(0, -6.5, 0);
      const direction = new THREE.Vector3(0, 1, 0);
      let progress = 0;

      for (const character of lSystem) {
        if (character === "F") {
          const { geometry, nextPosition } = createSegment(
            position,
            direction,
            progress
          );
          geometries.push(geometry);
          position.copy(nextPosition);
          progress += 0.06;
        } else if (character === "+") {
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), randomAngle());
        } else if (character === "-") {
          direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), -randomAngle());
        } else if (character === "&") {
          direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), randomAngle());
        } else if (character === "^") {
          direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), -randomAngle());
        } else if (character === "[") {
          stack.push({
            position: position.clone(),
            direction: direction.clone(),
            progress,
          });
        } else if (character === "]") {
          const state = stack.pop();
          if (state) {
            position.copy(state.position);
            direction.copy(state.direction);
            progress = state.progress;
          }
        }
      }

      const mergedGeometry = mergeGeometries(geometries, true);
      geometries.forEach((geometry) => geometry.dispose());

      return new THREE.Mesh(mergedGeometry, material);
    }

    treeMesh = generateTree();
    scene.add(treeMesh);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;

      const elapsedTime = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uGlowBoost.value = THREE.MathUtils.lerp(
        material.uniforms.uGlowBoost.value,
        1,
        0.015
      );

      if (treeMesh) {
        treeMesh.rotation.x = Math.sin(elapsedTime * 0.5) / 6;
        treeMesh.rotation.z = Math.cos(elapsedTime * 0.35) / -7;
        treeMesh.rotation.y = elapsedTime * 0.08;
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);

      if (treeMesh) {
        scene.remove(treeMesh);
        treeMesh.geometry.dispose();
      }

      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 block opacity-70 mix-blend-screen [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
    />
  );
}

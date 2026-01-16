/**
 * CeramicDriftCanvasReverse
 *
 * Same as CeramicDriftCanvas but animates from RIGHT to LEFT (reverse direction)
 * Used in ExperiencesSection for visual variation
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CeramicDriftCanvasReverseProps {
  sectionRef: React.RefObject<HTMLElement>;
}

const CeramicDriftCanvasReverse = ({
  sectionRef,
}: CeramicDriftCanvasReverseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    model?: THREE.Group;
    scrollTrigger?: ScrollTrigger;
    rafId?: number;
  }>({});

  useEffect(() => {
    if (!canvasRef.current || !sectionRef.current) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;

    // ═══════════════════════════════════════════════════════════
    // RENDERER SETUP
    // ═══════════════════════════════════════════════════════════
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    sceneRef.current.renderer = renderer;

    // ═══════════════════════════════════════════════════════════
    // SCENE & CAMERA
    // ═══════════════════════════════════════════════════════════
    const scene = new THREE.Scene();
    sceneRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      35,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);
    sceneRef.current.camera = camera;

    // ═══════════════════════════════════════════════════════════
    // LIGHTING
    // ═══════════════════════════════════════════════════════════
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(-6, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(5, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 2.0, 20);
    rimLight.position.set(0, 2, -8);
    scene.add(rimLight);

    // ═══════════════════════════════════════════════════════════
    // LOAD CERAMIC MODEL
    // ═══════════════════════════════════════════════════════════
    const loader = new GLTFLoader();

    loader.load(
      "/src/assets/base_basic_pbr.glb",
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const material = mesh.material as THREE.MeshStandardMaterial;
              material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.rotation.y = THREE.MathUtils.degToRad(-90);

        // REVERSE: Start from TOP-RIGHT instead of top-left
        const container = new THREE.Group();
        container.add(model);
        container.position.set(7, 5, 2); // Start RIGHT (positive X)
        container.scale.setScalar(2.8); // Increased scale to match TexturesGrid visibility

        scene.add(container);
        sceneRef.current.model = container;

        // ═══════════════════════════════════════════════════════════
        // GSAP SCROLL ANIMATION — REVERSE DRIFT (RIGHT TO LEFT)
        // ═══════════════════════════════════════════════════════════
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 2.5,
            onUpdate: (self) => {
              const breathe = Math.sin(self.progress * Math.PI * 2) * 0.3;
              if (sceneRef.current.model) {
                sceneRef.current.model.position.y =
                  gsap.utils.interpolate(5, -5, self.progress) + breathe;
              }
            },
          },
        });

        // Position: top-right → bottom-left (REVERSE diagonal)
        timeline.to(
          container.position,
          {
            x: -7, // LEFT (negative X)
            z: -1,
            ease: "none",
          },
          0
        );

        // Rotation: same 1.5 rotations
        timeline.to(
          container.rotation,
          {
            y: THREE.MathUtils.degToRad(540),
            x: THREE.MathUtils.degToRad(45),
            z: THREE.MathUtils.degToRad(30),
            ease: "none",
          },
          0
        );

        sceneRef.current.scrollTrigger = timeline.scrollTrigger;
      },
      undefined,
      (error) => {
        console.error("Failed to load ceramic model:", error);
      }
    );

    // ═══════════════════════════════════════════════════════════
    // RENDER LOOP
    // ═══════════════════════════════════════════════════════════
    const animate = () => {
      sceneRef.current.rafId = requestAnimationFrame(animate);

      if (
        sceneRef.current.renderer &&
        sceneRef.current.scene &&
        sceneRef.current.camera
      ) {
        sceneRef.current.renderer.render(
          sceneRef.current.scene,
          sceneRef.current.camera
        );
      }
    };
    animate();

    // ═══════════════════════════════════════════════════════════
    // RESPONSIVE RESIZE
    // ═══════════════════════════════════════════════════════════
    const handleResize = () => {
      if (
        !canvasRef.current ||
        !sceneRef.current.camera ||
        !sceneRef.current.renderer
      )
        return;

      const width = canvasRef.current.offsetWidth;
      const height = canvasRef.current.offsetHeight;

      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // ═══════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════
    return () => {
      window.removeEventListener("resize", handleResize);

      if (sceneRef.current.rafId) {
        cancelAnimationFrame(sceneRef.current.rafId);
      }

      if (sceneRef.current.scrollTrigger) {
        sceneRef.current.scrollTrigger.kill();
      }

      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }

      if (sceneRef.current.scene) {
        sceneRef.current.scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((material) => material.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      }
    };
  }, [sectionRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0"
      style={{
        mixBlendMode: "normal",
      }}
    />
  );
};

export default CeramicDriftCanvasReverse;

/**
 * CeramicDriftCanvas
 *
 * Awwwards-level WebGL background for TexturesGridSection
 *
 * Philosophy:
 * - Weighted, slow motion (ceramic has mass)
 * - Minimal rotation (±3° prevents toy-like spinning)
 * - Scroll-driven narrative (user controls the drift)
 * - Physically-based lighting (PBR material demands it)
 * - Depth separation (subtle z-axis keeps it atmospheric)
 *
 * Technical decisions:
 * - GSAP ScrollTrigger over RAF for precision sync
 * - Three.js WebGLRenderer with physically correct lights
 * - Soft shadows (ceramic is matte, not metallic)
 * - No bloom/post (keeps focus on craftsmanship)
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ceramicModelUrl from "@/assets/base_basic_pbr.glb?url";

gsap.registerPlugin(ScrollTrigger);

interface CeramicDriftCanvasProps {
  sectionRef: React.RefObject<HTMLElement>;
}

const CeramicDriftCanvas = ({ sectionRef }: CeramicDriftCanvasProps) => {
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
    // Physically correct tone mapping prevents blown-out highlights
    // Alpha true for seamless background blend
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2; // Boosted significantly for vibrant PBR colors
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for matte ceramic

    sceneRef.current.renderer = renderer;

    // ═══════════════════════════════════════════════════════════
    // SCENE & CAMERA
    // ═══════════════════════════════════════════════════════════
    const scene = new THREE.Scene();
    // Removed fog to prevent color desaturation
    sceneRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      35, // Narrow FOV = less distortion = premium feel
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 18); // Pull back for elegance
    sceneRef.current.camera = camera;

    // ═══════════════════════════════════════════════════════════
    // LIGHTING — CERAMICS STUDIO AESTHETIC
    // ═══════════════════════════════════════════════════════════

    // Ambient — prevents pure black shadows (ceramic is reflective)
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambient);

    // Key light — top-left, soft, like north-facing studio window
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

    // Fill light — bottom-right, warm, prevents dead zones
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(5, -3, 3);
    scene.add(fillLight);

    // Rim light — back, cool, separates model from fog
    const rimLight = new THREE.PointLight(0xffffff, 2.0, 20);
    rimLight.position.set(0, 2, -8);
    scene.add(rimLight);

    // ═══════════════════════════════════════════════════════════
    // LOAD CERAMIC MODEL
    // ═══════════════════════════════════════════════════════════
    const loader = new GLTFLoader();

    loader.load(
      ceramicModelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Ensure PBR materials receive correct lighting and preserve colors
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const material = mesh.material as THREE.MeshStandardMaterial;
              material.needsUpdate = true;
              // Preserve original PBR properties for accurate colors
            }
          }
        });

        // Center model pivot
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Flip model -90° on Y-axis to reorient
        model.rotation.y = THREE.MathUtils.degToRad(-90);

        // Initial position: TOP-LEFT, slightly off-screen
        const container = new THREE.Group();
        container.add(model);
        container.position.set(-7, 5, 2); // Start position
        container.scale.setScalar(2.2); // Adjust to fit canvas

        scene.add(container);
        sceneRef.current.model = container;

        // ═══════════════════════════════════════════════════════════
        // GSAP SCROLL ANIMATION — THE DRIFT
        // ═══════════════════════════════════════════════════════════
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 2.5, // Increased lag for slower, more weighted feel
            onUpdate: (self) => {
              // Gentle floating on Y-axis (breathing movement)
              const breathe = Math.sin(self.progress * Math.PI * 2) * 0.3;
              if (sceneRef.current.model) {
                sceneRef.current.model.position.y =
                  gsap.utils.interpolate(5, -5, self.progress) + breathe;
              }
            },
          },
        });

        // Position: top-left → bottom-right (diagonal drift)
        timeline.to(
          container.position,
          {
            x: 7, // Right
            z: -1, // Subtle depth shift (parallax)
            ease: "none", // Linear for scroll sync
          },
          0,
        );

        // Rotation: scroll-based continuous rotation on all axes
        timeline.to(
          container.rotation,
          {
            y: THREE.MathUtils.degToRad(540), // 1.5 full rotations
            x: THREE.MathUtils.degToRad(45), // Increased tilting motion
            z: THREE.MathUtils.degToRad(30), // Increased rolling motion
            ease: "none",
          },
          0,
        );

        sceneRef.current.scrollTrigger = timeline.scrollTrigger;
      },
      undefined,
      (error) => {
        console.error("Failed to load ceramic model:", error);
      },
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
          sceneRef.current.camera,
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
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      style={{
        mixBlendMode: "normal",
      }}
    />
  );
};

export default CeramicDriftCanvas;

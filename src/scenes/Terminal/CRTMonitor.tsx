import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import gsap from "gsap";
import vertexShader from "./shaders/crt.vert.glsl?raw";
import fragmentShader from "./shaders/crt.frag.glsl?raw";

useGLTF.preload("/models/crt.glb");

const SCREEN_MESH_NAME = "Plane009_1";

export type ScreenState = "off" | "booting" | "ready" | "diving" | "awake";

type CRTUniforms = {
    uTime:                { value: number };
    uFont:                { value: THREE.Texture };
    uScreenState:         { value: number };
    uBootProgress:        { value: number };
    uPromptProgress:      { value: number };
    uDiveProgress:        { value: number };
    uShowPortfolioPrompt: { value: number };
};

type CRTMonitorProps = {
    onDiveComplete?: () => void;
    onBootDrift?: (progress: number) => void;
    onDive?: (progress: number) => void;
};

export function CRTMonitor({ onDiveComplete, onBootDrift, onDive }: CRTMonitorProps) {
    const { scene } = useGLTF("/models/crt.glb");
    const { gl }    = useThree();
    const groupRef      = useRef<THREE.Group>(null);
    const shaderMeshRef = useRef<THREE.Mesh | null>(null);
    const screenLightRef = useRef<THREE.PointLight>(null);
    const lowerLightRef  = useRef<THREE.PointLight>(null);

    const [screenState, setScreenState] = useState<ScreenState>("off");
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const mat = child.material as THREE.MeshStandardMaterial;
                [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap].forEach((tex) => {
                    if (tex) { tex.anisotropy = maxAnisotropy; tex.needsUpdate = true; }
                });
            }
        });
    }, [clonedScene, gl]);

    const fontTexture = useLoader(THREE.TextureLoader, "/fonts/cp437.png");
    useMemo(() => {
        fontTexture.minFilter      = THREE.NearestFilter;
        fontTexture.magFilter      = THREE.NearestFilter;
        fontTexture.generateMipmaps = false;
        fontTexture.colorSpace     = THREE.SRGBColorSpace;
    }, [fontTexture]);

    const uniformsRef = useRef<CRTUniforms>({
        uTime:                { value: 0 },
        uFont:                { value: fontTexture },
        uScreenState:         { value: 0 },
        uBootProgress:        { value: 0 },
        uPromptProgress:      { value: 0 },
        uDiveProgress:        { value: 0 },
        uShowPortfolioPrompt: { value: 0 },
    });

    useEffect(() => {
        uniformsRef.current.uFont.value = fontTexture;
    }, [fontTexture]);

    const screenMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: uniformsRef.current,
        side: THREE.DoubleSide,
    }), []);

    // ── Model setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        const screenMesh = clonedScene.getObjectByName(SCREEN_MESH_NAME);
        if (!(screenMesh instanceof THREE.Mesh)) {
            console.error(`Screen mesh "${SCREEN_MESH_NAME}" not found`);
            return;
        }

        screenMesh.visible = false;

        const srcGeo = screenMesh.geometry;
        const geo    = srcGeo.clone();
        geo.computeBoundingBox();
        const bbox = geo.boundingBox!;
        const min  = bbox.min;
        const size = bbox.getSize(new THREE.Vector3());

        const pos   = geo.getAttribute("position");
        const uvArr = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
            uvArr[i * 2 + 0] = (pos.getX(i) - min.x) / size.x;
            uvArr[i * 2 + 1] = (pos.getY(i) - min.y) / size.y;
        }
        geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));

        const shaderMesh = new THREE.Mesh(geo, screenMaterial);
        shaderMesh.position.copy(screenMesh.position);
        shaderMesh.quaternion.copy(screenMesh.quaternion);
        shaderMesh.scale.copy(screenMesh.scale);
        shaderMesh.renderOrder = 2;

        screenMesh.parent?.add(shaderMesh);
        shaderMeshRef.current = shaderMesh;

        if (groupRef.current) groupRef.current.updateWorldMatrix(true, true);
        const worldBox    = new THREE.Box3().setFromObject(clonedScene);
        const worldCenter = worldBox.getCenter(new THREE.Vector3());
        clonedScene.position.sub(worldCenter);
        clonedScene.updateMatrixWorld(true);

        const mw           = screenMesh.matrixWorld;
        const screenCenter = new THREE.Vector3().setFromMatrixPosition(mw);

        const main = screenLightRef.current;
        if (main) main.position.copy(screenCenter);

        const lower = lowerLightRef.current;
        if (lower) {
            lower.position.copy(screenCenter);
            lower.position.y -= 0.13;
        }

        return () => {
            shaderMesh.parent?.remove(shaderMesh);
            geo.dispose();
        };
    }, [clonedScene, screenMaterial]);

    // ── State transitions ───────────────────────────────────────────────────
    useEffect(() => {
        const u = uniformsRef.current;

        if (screenState === "off") {
            u.uScreenState.value         = 0;
            u.uBootProgress.value        = 0;
            u.uPromptProgress.value      = 0;
            u.uDiveProgress.value        = 0;
            u.uShowPortfolioPrompt.value = 0;
            return;
        }

        if (screenState === "booting") {
            u.uScreenState.value         = 1;
            u.uBootProgress.value        = 0;
            u.uPromptProgress.value      = 0;
            u.uShowPortfolioPrompt.value = 0;

            const driftRef = { value: 0 };

            const tl = gsap.timeline({ onComplete: () => setScreenState("ready") });
            tl.to(u.uBootProgress, { value: 1, duration: 2.2, ease: "none" }, 0);
            tl.to(driftRef, {
                value: 1,
                duration: 2.2,
                ease: "power2.inOut",
                onUpdate: () => onBootDrift?.(driftRef.value),
            }, 0);

            return () => { tl.kill(); };
        }

        if (screenState === "ready") {
            // Boot finished. Switch to ready, then type out the prompt
            // over 1.2s. During typing the prompt is visible (uShowPortfolioPrompt = 1)
            // but its content is gated by uPromptProgress in the shader.
            u.uScreenState.value         = 2;
            u.uBootProgress.value        = 1;
            u.uShowPortfolioPrompt.value = 1;
            u.uPromptProgress.value      = 0;

            const tl = gsap.timeline();
            tl.to(u.uPromptProgress, { value: 1, duration: 1.2, ease: "none" }, 0);

            return () => { tl.kill(); };
        }

        if (screenState === "diving") {
            u.uScreenState.value         = 2;
            u.uBootProgress.value        = 1;
            u.uShowPortfolioPrompt.value = 0;
            u.uPromptProgress.value      = 1;
            u.uDiveProgress.value        = 0;

            const diveRef = { value: 0 };

            const tl = gsap.timeline({
                onComplete: () => {
                    setScreenState("awake");
                    onDiveComplete?.();
                },
            });
            tl.to(u.uDiveProgress, { value: 1, duration: 1.9, ease: "power2.in" }, 0);
            tl.to(diveRef, {
                value: 1,
                duration: 1.9,
                ease: "power2.in",
                onUpdate: () => onDive?.(diveRef.value),
            }, 0);

            return () => { tl.kill(); };
        }
    }, [screenState, onBootDrift, onDive, onDiveComplete]);

    // ── ENTER key alternative trigger ────────────────────────────────────────
    useEffect(() => {
        if (screenState !== "ready") return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Enter") setScreenState("diving");
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [screenState]);

    // ── Per-frame: clock + light intensities ─────────────────────────────────
    useFrame((state) => {
        uniformsRef.current.uTime.value = state.clock.elapsedTime;

        const main  = screenLightRef.current;
        const lower = lowerLightRef.current;
        if (!main || !lower) return;

        const u      = uniformsRef.current;
        const stateV = u.uScreenState.value;
        const boot   = u.uBootProgress.value;
        const dive   = u.uDiveProgress.value;

        let mainTarget  = 0;
        let lowerTarget = 0;
        if (stateV >= 0.5 && stateV < 1.5) {
            mainTarget  = boot * 1.5;
            lowerTarget = boot * 1.0;
        } else if (stateV >= 1.5) {
            mainTarget  = 1.5 + dive * 4.0;
            lowerTarget = 1.0 + dive * 2.0;
        }

        main.intensity  += (mainTarget  - main.intensity)  * 0.15;
        lower.intensity += (lowerTarget - lower.intensity) * 0.15;
    });

    // Click on screen: boot from off, or dive from ready
    const handleScreenClick = () => {
        if (screenState === "off") setScreenState("booting");
        else if (screenState === "ready") setScreenState("diving");
    };

    return (
        <>
            <pointLight
                ref={screenLightRef}
                color="#33ff66"
                intensity={0}
                distance={0.3}
                decay={2}
            />
            <pointLight
                ref={lowerLightRef}
                color="#33ff66"
                intensity={0}
                distance={0.2}
                decay={2}
            />
            <group ref={groupRef} rotation={[0, Math.PI, 0]}>
                <primitive object={clonedScene} onClick={handleScreenClick} />
            </group>
        </>
    );
}
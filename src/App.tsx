import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Environment } from "@react-three/drei";
import { CRTMonitor } from "./scenes/Terminal/CRTMonitor";
import { Room } from "./scenes/Terminal/Room";
import { Portfolio } from "./scenes/Portfolio/Portfolio";
import { ACESFilmicToneMapping, PerspectiveCamera } from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

const CAMERA_OFF   = { z: -0.8,  fov: 35 };
const CAMERA_READY = { z: -0.50, fov: 35 };
const CAMERA_DIVED = { z: -0.15, fov: 55 };

type CameraAnimatorProps = {
    bootDriftRef:    React.MutableRefObject<number>;
    diveProgressRef: React.MutableRefObject<number>;
    sceneRef:        React.MutableRefObject<"terminal" | "awake">;
};
function CameraAnimator({ bootDriftRef, diveProgressRef, sceneRef }: CameraAnimatorProps) {
    const { camera } = useThree();

    useFrame(() => {
        if (!(camera instanceof PerspectiveCamera)) return;
        if (sceneRef.current === "awake") return;

        const drift = bootDriftRef.current;
        const dive  = diveProgressRef.current;

        const baseZ   = CAMERA_OFF.z   + (CAMERA_READY.z   - CAMERA_OFF.z)   * drift;
        const baseFov = CAMERA_OFF.fov + (CAMERA_READY.fov - CAMERA_OFF.fov) * drift;

        const finalZ   = baseZ   + (CAMERA_DIVED.z   - baseZ)   * dive;
        const finalFov = baseFov + (CAMERA_DIVED.fov - baseFov) * dive;

        camera.position.z = finalZ;
        if (camera.fov !== finalFov) {
            camera.fov = finalFov;
            camera.updateProjectionMatrix();
        }
    });

    return null;
}

export default function App() {
    const bootDriftRef    = useRef(0);
    const diveProgressRef = useRef(0);
    const sceneRef        = useRef<"terminal" | "awake">("terminal");

    const [scene, setScene] = useState<"terminal" | "awake">("awake");
    const [flashOpacity, setFlashOpacity] = useState(0);

    useEffect(() => {
        sceneRef.current = scene;
    }, [scene]);

    const handleBootDrift = useCallback((progress: number) => {
        bootDriftRef.current = progress;
    }, []);

    const handleDive = useCallback((progress: number) => {
        diveProgressRef.current = progress;
        const flashStart = 0.5;
        if (progress >= flashStart) {
            const flashProgress = (progress - flashStart) / (1 - flashStart);
            setFlashOpacity(Math.min(1, flashProgress * 1.5));
        }
    }, []);

    const handleDiveComplete = useCallback(() => {
        setScene("awake");
        setTimeout(() => {
            setFlashOpacity(0);
            diveProgressRef.current = 0;
            bootDriftRef.current = 0;
        }, 50);
    }, []);

    return (
        <div style={{ width: "100vw", minHeight: "100vh", position: "relative", background: "#0a0a0a" }}>
            {scene === "terminal" && (
                <Canvas
                    camera={{ position: [0, 0, CAMERA_OFF.z], fov: CAMERA_OFF.fov }}
                    style={{ width: "100vw", height: "100vh", background: "#0a0a0a" }}
                    shadows
                    gl={{
                        antialias: true,
                        powerPreference: "high-performance",
                        toneMapping: ACESFilmicToneMapping,
                        toneMappingExposure: 1.0,
                    }}
                    dpr={[1, 2]}
                    onCreated={({ camera }) => {
                        camera.lookAt(0, 0, 0);
                        RectAreaLightUniformsLib.init();
                    }}
                >
                    <fog attach="fog" args={["#000000", 2, 6]} />

                    <Suspense fallback={null}>
                        <CameraAnimator
                            bootDriftRef={bootDriftRef}
                            diveProgressRef={diveProgressRef}
                            sceneRef={sceneRef}
                        />

                        <CRTMonitor
                            onBootDrift={handleBootDrift}
                            onDive={handleDive}
                            onDiveComplete={handleDiveComplete}
                        />
                        <Room />

                        <Environment preset="studio" background={false} environmentIntensity={0.15} />
                        <directionalLight position={[2, 3, -2]} intensity={0.8} color="#fff0d0" />
                        <directionalLight position={[-2, 1, -1]} intensity={0.1} color="#a0b8d0" />

                        <EffectComposer>
                            <Bloom
                                intensity={1.5}
                                luminanceThreshold={1.0}
                                luminanceSmoothing={0.1}
                                mipmapBlur
                                radius={0.15}
                            />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            )}

            {scene === "awake" && <Portfolio />}

            {/* Fade-to-dark overlay covers scene swap */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "#000000",
                    opacity: flashOpacity,
                    pointerEvents: "none",
                    transition: scene === "awake" ? "opacity 0.6s ease-out" : "none",
                    zIndex: 100,
                }}
            />
        </div>
    );
}
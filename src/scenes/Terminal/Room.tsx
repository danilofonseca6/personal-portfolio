import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DESK_Y    = -0.45;
const DESK_TOP  = DESK_Y + 0.03;

// ── Panel grid canvas texture ─────────────────────────────────────────────────
function createPanelTexture(cols: number, rows: number): THREE.CanvasTexture {
    const W = 256, H = 256;
    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const gapW  = W / cols;
    const gapH  = H / rows;
    const border = 6;
    const inset  = 3;

    // base fill
    ctx.fillStyle = "#0d2418";
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * gapW;
            const y = r * gapH;
            const pw = gapW - 2;
            const ph = gapH - 2;

            // raised border
            ctx.fillStyle = "#2c6040";
            ctx.fillRect(x + 1, y + 1, pw, ph);

            // recessed face
            ctx.fillStyle = "#1a4a2a";
            ctx.fillRect(x + 1 + border, y + 1 + border, pw - border * 2, ph - border * 2);

            // inner inset shadow
            ctx.fillStyle = "#0f3020";
            ctx.fillRect(x + 1 + border + inset, y + 1 + border + inset,
                pw - (border + inset) * 2, ph - (border + inset) * 2);

            // catch-light at top edge of border
            ctx.fillStyle = "rgba(100,220,140,0.12)";
            ctx.fillRect(x + 1, y + 1, pw, 2);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// ── Room ──────────────────────────────────────────────────────────────────────
export function Room() {
    const spotRef = useRef<THREE.SpotLight>(null!);

    // pre-build textures once
    const backTex  = useMemo(() => { const t = createPanelTexture(8, 5); t.repeat.set(1, 1); return t; }, []);
    const sideTex  = useMemo(() => { const t = createPanelTexture(5, 5); t.repeat.set(1, 1); return t; }, []);
    const floorTex = useMemo(() => {
        const W = 256, H = 256;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#080f0a";
        ctx.fillRect(0, 0, W, H);
        // subtle tile lines
        ctx.strokeStyle = "#0d1f12";
        ctx.lineWidth = 1;
        const tileSize = 64;
        for (let x = 0; x <= W; x += tileSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += tileSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const t = new THREE.CanvasTexture(canvas);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(6, 6);
        return t;
    }, []);

    // gentle spotlight flicker
    useFrame(({ clock }) => {
        if (spotRef.current) {
            const t = clock.getElapsedTime();
            spotRef.current.intensity = 1.1 + Math.sin(t * 0.7) * 0.05 + Math.sin(t * 2.3) * 0.02;
        }
    });

    return (
        <group>
            {/* ── lights ──────────────────────────────────────────────────── */}
            <ambientLight intensity={0.12} color="#4a5e6a" />

            {/* implied desk lamp — above-left of monitor */}
            <spotLight
                ref={spotRef}
                position={[0.9, 0.9, 0.4]}
                target-position={[0, -0.4, 0.2]}
                intensity={1.2}
                color="#ffd090"
                angle={Math.PI / 5}
                penumbra={0.45}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.002}
            />
            {/* cool fill from the screen side */}
            <directionalLight position={[0, 0.3, -1.2]} intensity={0.18} color="#7ab8d0" />

            {/* ── back wall ───────────────────────────────────────────────── */}
            <mesh position={[0, 0.3, 2.1]} rotation={[0, Math.PI, 0]} receiveShadow>
                <planeGeometry args={[7, 4.5]} />
                <meshStandardMaterial
                    map={backTex}
                    color="#3a7858"
                    roughness={0.85}
                    metalness={0.06}
                />
            </mesh>

            {/* ── left wall ───────────────────────────────────────────────── */}
            <mesh position={[-3, 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[6, 4.5]} />
                <meshStandardMaterial
                    map={sideTex}
                    color="#326850"
                    roughness={0.88}
                    metalness={0.04}
                />
            </mesh>

            {/* ── right wall ──────────────────────────────────────────────── */}
            <mesh position={[3, 0.3, 1.0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[6, 4.5]} />
                <meshStandardMaterial
                    map={sideTex}
                    color="#326850"
                    roughness={0.88}
                    metalness={0.04}
                />
            </mesh>

            {/* ── ceiling (plain dark) ────────────────────────────────────── */}
            <mesh position={[0, 1.8, 1.0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[7, 6]} />
                <meshStandardMaterial color="#0a1a10" roughness={1} metalness={0} />
            </mesh>

            {/* ── floor ───────────────────────────────────────────────────── */}
            <mesh position={[0, -0.6, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[10, 8]} />
                <meshStandardMaterial
                    map={floorTex}
                    color="#1a2e1e"
                    roughness={0.95}
                    metalness={0.0}
                />
            </mesh>

            {/* ── desk surface ────────────────────────────────────────────── */}
            <mesh position={[0, DESK_Y, 0.15]} castShadow receiveShadow>
                <boxGeometry args={[2.5, 0.06, 0.9]} />
                <meshStandardMaterial color="#1c2a1e" roughness={0.7} metalness={0.05} />
            </mesh>
            {/* desk front face (slightly lighter edge) */}
            <mesh position={[0, DESK_Y - 0.12, 0.62]} receiveShadow>
                <boxGeometry args={[2.5, 0.24, 0.04]} />
                <meshStandardMaterial color="#162214" roughness={0.8} metalness={0.0} />
            </mesh>

            {/* desk legs */}
            {([-1.1, 1.1] as const).map((x) =>
                ([-0.3, 0.55] as const).map((z) => (
                    <mesh key={`${x}-${z}`} position={[x, DESK_Y - 0.35, z]} castShadow>
                        <boxGeometry args={[0.06, 0.58, 0.06]} />
                        <meshStandardMaterial color="#111a12" roughness={0.9} metalness={0} />
                    </mesh>
                ))
            )}

            {/* ── desk props ──────────────────────────────────────────────── */}

            {/* stack of papers (left of monitor) */}
            <mesh position={[-0.72, DESK_TOP + 0.005, 0.12]} rotation={[0, 0.18, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.18, 0.01, 0.24]} />
                <meshStandardMaterial color="#e2ddd0" roughness={1} metalness={0} />
            </mesh>
            <mesh position={[-0.71, DESK_TOP + 0.012, 0.13]} rotation={[0, 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.18, 0.008, 0.24]} />
                <meshStandardMaterial color="#d8d3c6" roughness={1} metalness={0} />
            </mesh>

            {/* coffee mug */}
            <mesh position={[-0.45, DESK_TOP + 0.04, 0.22]} castShadow receiveShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
                <meshStandardMaterial color="#e8e4dc" roughness={0.6} metalness={0.0} />
            </mesh>
            {/* mug handle (thin box approximation) */}
            <mesh position={[-0.405, DESK_TOP + 0.04, 0.22]} castShadow>
                <torusGeometry args={[0.025, 0.005, 6, 12, Math.PI]} />
                <meshStandardMaterial color="#d4d0c8" roughness={0.7} metalness={0} />
            </mesh>

            {/* ashtray */}
            <mesh position={[0.65, DESK_TOP + 0.01, 0.28]} castShadow receiveShadow>
                <cylinderGeometry args={[0.08, 0.07, 0.02, 20]} />
                <meshStandardMaterial color="#2a3a35" roughness={0.5} metalness={0.15} />
            </mesh>
            {/* ashtray rim notch highlight */}
            <mesh position={[0.65, DESK_TOP + 0.018, 0.28]}>
                <torusGeometry args={[0.075, 0.004, 6, 20]} />
                <meshStandardMaterial color="#3a5048" roughness={0.4} metalness={0.2} />
            </mesh>

            {/* small lamp base (implies where the spotLight lives) */}
            <mesh position={[0.9, DESK_TOP + 0.01, 0.2]} castShadow receiveShadow>
                <cylinderGeometry args={[0.055, 0.065, 0.02, 16]} />
                <meshStandardMaterial color="#1a2820" roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[0.9, DESK_TOP + 0.08, 0.2]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.14, 8]} />
                <meshStandardMaterial color="#1c2c22" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0.88, DESK_TOP + 0.16, 0.2]} rotation={[0, 0, 0.4]} castShadow>
                <coneGeometry args={[0.055, 0.09, 16, 1, true]} />
                <meshStandardMaterial color="#2a3a2e" roughness={0.4} metalness={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

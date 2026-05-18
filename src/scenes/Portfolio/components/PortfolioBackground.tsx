import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cameraTarget } from "../cameraStore";

gsap.registerPlugin(ScrollTrigger);

// ─── constants ────────────────────────────────────────────────────────────────
const NODE_COUNT      = 130; // 56 front + 56 back + 10 spine ridge + 8 belly ridge
const KNN_K           = 3;
const NODE_COLOR      = new THREE.Color("#33ff66");  // --green
const EDGE_COLOR      = new THREE.Color("#1a9942");  // --green-dim
const LERP            = 0.08;
const AUTO_ROT_Y      = 0.0005;
// fov=50, camera z=7 → visible half-width ≈ 5.8 (x) / 3.25 (y); ±12/±7 puts most nodes off-screen
const CLOUD_X         = 24;   // spread in x
const CLOUD_Y         = 14;   // spread in y
const DRAG_THRESHOLD      = 5;    // px before a pointer-down becomes a drag
const DRAG_SENS           = 0.007; // rad / px
const HERO_EDGE_MAX_DIST  = 2.8;  // in hero mode, hide edges longer than this → disconnected look

// ─── shape generators — return NODE_COUNT Vector3s centred at origin ──────────
function genSphere(n: number): THREE.Vector3[] {
    const phi = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: n }, (_, i) => {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        return new THREE.Vector3(r * Math.cos(phi * i), y, r * Math.sin(phi * i)).multiplyScalar(2);
    });
}

function genTorus(n: number): THREE.Vector3[] {
    const R = 1.6, r = 0.6;
    return Array.from({ length: n }, (_, i) => {
        const u = (2 * Math.PI * i) / n;
        const v = (2 * Math.PI * i * 7) / n;
        return new THREE.Vector3(
            (R + r * Math.cos(v)) * Math.cos(u),
            r * Math.sin(v),
            (R + r * Math.cos(v)) * Math.sin(u),
        );
    });
}

function genTorusKnot(n: number): THREE.Vector3[] {
    const p = 2, q = 3, scale = 1.4;
    return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / n;
        return new THREE.Vector3(
            scale * (2 + Math.cos(q * t)) * Math.cos(p * t),
            scale * (2 + Math.cos(q * t)) * Math.sin(p * t),
            scale * Math.sin(q * t),
        );
    });
}

function genIcosahedron(n: number): THREE.Vector3[] {
    const geo  = new THREE.IcosahedronGeometry(2, 2);
    const pos  = geo.attributes.position!;
    const seen = new Map<string, THREE.Vector3>();
    for (let i = 0; i < pos.count; i++) {
        const v   = new THREE.Vector3().fromBufferAttribute(pos, i);
        const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
        if (!seen.has(key)) seen.set(key, v);
    }
    const unique = Array.from(seen.values());
    while (unique.length < n) unique.push(unique[unique.length % unique.length]!.clone());
    geo.dispose();
    return unique.slice(0, n);
}

function genHelix(n: number): THREE.Vector3[] {
    return Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 6;
        return new THREE.Vector3(Math.cos(t) * 1.8, (i / n) * 4 - 2, Math.sin(t) * 1.8);
    });
}

function genPointCloud(n: number): THREE.Vector3[] {
    // z=0: perfectly flat so it reads as a 2D network graph, not 3D
    return Array.from({ length: n }, () =>
        new THREE.Vector3(
            (Math.random() - 0.5) * CLOUD_X,
            (Math.random() - 0.5) * CLOUD_Y,
            0,
        )
    );
}

// ─── Jaguar leaper — ellipsoidal body sections ───────────────────────────────
// Each anatomical section is a Fibonacci-sampled ellipsoid. KNN edges
// (computed from the jaguar positions) connect sections naturally.
// Head right (+x), tail left (−x), legs down (−y).
function genJaguarLeap(n: number): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    const S = 0.85;
    const phi = Math.PI * (3 - Math.sqrt(5));

    function addEllipsoid(count: number, cx: number, cy: number, cz: number,
                          rx: number, ry: number, rz: number) {
        for (let i = 0; i < count; i++) {
            const t     = i / Math.max(1, count - 1);
            const cosA  = 1 - t * 2;
            const sinA  = Math.sqrt(Math.max(0, 1 - cosA * cosA));
            const angle = phi * i;
            pts.push(new THREE.Vector3(
                (cx + rx * sinA * Math.cos(angle)) * S,
                (cy + ry * cosA) * S,
                (cz + rz * sinA * Math.sin(angle)) * S,
            ));
        }
    }

    addEllipsoid(35, -0.05,  0.22, 0,  1.42, 0.30, 0.36);  // main torso
    addEllipsoid( 4,  1.15,  0.36, 0,  0.14, 0.16, 0.14);  // neck
    addEllipsoid(14,  1.58,  0.54, 0,  0.26, 0.20, 0.22);  // skull
    addEllipsoid( 6,  1.86,  0.40, 0,  0.16, 0.10, 0.12);  // muzzle
    addEllipsoid( 4,  1.78,  0.28, 0,  0.14, 0.07, 0.10);  // jaw
    addEllipsoid(15, -0.90,  0.14, 0,  0.50, 0.42, 0.46);  // haunches
    addEllipsoid(12,  0.88,  0.08, 0,  0.34, 0.36, 0.38);  // front shoulder
    addEllipsoid(10, -1.26, -0.18, 0,  0.16, 0.32, 0.14);  // back thigh
    addEllipsoid( 8, -1.50, -0.62, 0,  0.13, 0.16, 0.09);  // back lower leg
    addEllipsoid( 8,  1.18, -0.35, 0,  0.14, 0.30, 0.13);  // front thigh
    addEllipsoid( 8,  1.36, -0.68, 0,  0.11, 0.17, 0.08);  // front lower leg
    addEllipsoid( 6, -2.10,  0.12, 0,  0.52, 0.05, 0.04);  // tail (thin & long)
    // 35+4+14+6+4+15+12+10+8+8+8+6 = 130

    return pts.slice(0, n);
}

// ─── KNN edges ────────────────────────────────────────────────────────────────
function computeEdges(pts: THREE.Vector3[], k: number): number[] {
    const indices: number[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < pts.length; i++) {
        const closest = pts
            .map((p, j) => ({ j, d: pts[i]!.distanceTo(p) }))
            .filter(({ j }) => j !== i)
            .sort((a, b) => a.d - b.d)
            .slice(0, k);
        for (const { j } of closest) {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (!seen.has(key)) { seen.add(key); indices.push(i, j); }
        }
    }
    return indices;
}

// ─── section → shape ──────────────────────────────────────────────────────────
type ShapeKey = "pointCloud" | "sphere" | "torus" | "torusKnot" | "icosahedron" | "helix" | "jaguarLeap";

const SECTION_SHAPES: { id: string; shape: ShapeKey; groupX: number }[] = [
    { id: "hero",        shape: "pointCloud",  groupX:  0   },
    { id: "about",       shape: "sphere",      groupX: -2.2 },
    { id: "skills",      shape: "torus",       groupX:  2.2 },
    { id: "exp-menzies", shape: "helix",       groupX: -2.2 },
    { id: "exp-jlr",     shape: "jaguarLeap",  groupX:  2.2 },
    { id: "exp-ymat",    shape: "sphere",      groupX: -2.2 },
    { id: "now-working", shape: "icosahedron", groupX:  2.2 },
    { id: "contact",     shape: "torusKnot",   groupX:  0   },
];

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
    const shapes = useMemo<Record<ShapeKey, THREE.Vector3[]>>(() => ({
        pointCloud:  genPointCloud(NODE_COUNT),
        sphere:      genSphere(NODE_COUNT),
        torus:       genTorus(NODE_COUNT),
        jaguarLeap:  genJaguarLeap(NODE_COUNT),
        torusKnot:   genTorusKnot(NODE_COUNT),
        icosahedron: genIcosahedron(NODE_COUNT),
        helix:       genHelix(NODE_COUNT),
    }), []);

    const positions   = useRef<THREE.Vector3[]>(Array.from({ length: NODE_COUNT }, () => new THREE.Vector3()));
    const wanderTgts  = useRef<THREE.Vector3[]>(Array.from({ length: NODE_COUNT }, () => new THREE.Vector3()));
    const targetShape = useRef<ShapeKey>("pointCloud");
    const groupRef    = useRef<THREE.Group>(null);

    // drag state — timestamp-based so there's no setTimeout to lose
    const isDragging  = useRef(false);   // true while pointer is down and moving past threshold
    const dragEndedAt = useRef(0);       // performance.now() when last drag ended; 0 = never dragged
    const RESUME_MS   = 2000;            // ms after release before auto-rotate resumes
    const dragDeltaY  = useRef(0);       // horizontal drag → rotation.y
    const dragDeltaX  = useRef(0);       // vertical drag   → rotation.x

    // ── geometry ──
    const nodesMesh = useMemo(() => {
        const geo  = new THREE.SphereGeometry(0.045, 6, 6);
        const mat  = new THREE.MeshBasicMaterial({ color: NODE_COLOR, transparent: true, opacity: 0.85 });
        const mesh = new THREE.InstancedMesh(geo, mat, NODE_COUNT);
        mesh.frustumCulled = false;
        return mesh;
    }, []);

    // ── KNN edges (sphere topology — used for all non-jaguar shapes) ──
    const edgeIdx = useMemo(() => computeEdges(shapes.sphere, KNN_K), [shapes.sphere]);
    const knnLineGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeIdx.length * 3), 3));
        return geo;
    }, [edgeIdx]);
    const knnLineMesh = useMemo(() =>
        new THREE.LineSegments(knnLineGeo, new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: 0.5 })),
    [knnLineGeo]);

    // ── Jaguar KNN edges — computed from jaguar positions, not sphere ──
    const jaguarEdgeIdx = useMemo(() => computeEdges(shapes.jaguarLeap, 4), [shapes.jaguarLeap]);
    const jaguarLineGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(jaguarEdgeIdx.length * 3), 3));
        return geo;
    }, [jaguarEdgeIdx]);
    const jaguarLineMesh = useMemo(() =>
        new THREE.LineSegments(jaguarLineGeo, new THREE.LineBasicMaterial({ color: EDGE_COLOR, transparent: true, opacity: 0.5 })),
    [jaguarLineGeo]);

    useEffect(() => {
        const g = groupRef.current;
        if (!g) return;
        g.add(nodesMesh, knnLineMesh, jaguarLineMesh);
        return () => { g.remove(nodesMesh); g.remove(knnLineMesh); g.remove(jaguarLineMesh); };
    }, [nodesMesh, knnLineMesh, jaguarLineMesh]);

    useEffect(() => {
        const cloud = shapes.pointCloud;
        positions.current.forEach((p, i)  => p.copy(cloud[i]!));
        wanderTgts.current.forEach((t, i) => t.copy(cloud[i]!));
    }, [shapes]);

    // ── wander ──
    const wanderOn = useRef(false);
    const tweens   = useRef<gsap.core.Tween[]>([]);

    function startWander() {
        if (wanderOn.current) return;
        wanderOn.current = true;
        tweens.current.forEach(t => t.kill());
        tweens.current = wanderTgts.current.map((tgt) => {
            const go = (): gsap.core.Tween => gsap.to(tgt, {
                x: (Math.random() - 0.5) * CLOUD_X,
                y: (Math.random() - 0.5) * CLOUD_Y,
                z: 0, // stay flat — depth appears only when shapes form
                duration: 10 + Math.random() * 8,
                ease: "sine.inOut",
                onComplete: () => { if (wanderOn.current) go(); },
            });
            return go();
        });
    }

    function stopWander() {
        wanderOn.current = false;
        tweens.current.forEach(t => t.kill());
        tweens.current = [];
    }

    // ── scroll → shape + slide ──
    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;
        startWander();

        const triggers = SECTION_SHAPES.map(({ id, shape, groupX }) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const apply = () => {
                targetShape.current = shape;
                if (shape === "pointCloud") {
                    startWander();
                    gsap.to(group.rotation, { x: 0, y: 0, duration: 1.0, ease: "power2.out" });
                } else {
                    stopWander();
                    gsap.to(group.position, { y: 0, duration: 0.8, ease: "power2.out" });
                }
                gsap.to(group.position, { x: groupX, duration: 1.2, ease: "power2.inOut" });
            };
            return ScrollTrigger.create({
                trigger: el,
                start: id === "hero" ? "top top" : "top center",
                end:   "bottom center",
                onEnter:     apply,
                onEnterBack: apply,
            });
        });

        return () => { stopWander(); triggers.forEach(t => t?.kill()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── drag-to-rotate (window-level, threshold-gated) ──
    useEffect(() => {
        let startX = 0, startY = 0;
        let downX  = 0, downY  = 0;

        const onDown = (e: PointerEvent) => {
            startX = e.clientX; startY = e.clientY;
            downX  = e.clientX; downY  = e.clientY;
            isDragging.current = false;
        };

        const onMove = (e: PointerEvent) => {
            if (e.buttons === 0) return;
            const totalMoved = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (!isDragging.current && totalMoved > DRAG_THRESHOLD) {
                isDragging.current = true;
                dragEndedAt.current = Infinity; // suppress resume while actively dragging
            }
            if (isDragging.current) {
                dragDeltaY.current += (e.clientX - downX) * DRAG_SENS;
                dragDeltaX.current += (e.clientY - downY) * DRAG_SENS;
            }
            downX = e.clientX; downY = e.clientY;
        };

        const onUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                dragEndedAt.current = performance.now(); // start the resume countdown
            }
        };

        window.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup",   onUp);
        return () => {
            window.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup",   onUp);
        };
    }, []);

    const mat4 = useMemo(() => new THREE.Matrix4(), []);

    useFrame(({ camera }) => {
        const group = groupRef.current;
        if (!group) return;
        camera.position.z += (cameraTarget.z - camera.position.z) * 0.06;

        const isCloud  = targetShape.current === "pointCloud";
        const isJaguar = targetShape.current === "jaguarLeap";

        const resting = !isDragging.current && (performance.now() - dragEndedAt.current > RESUME_MS);
        if (resting && !isCloud) group.rotation.y += AUTO_ROT_Y;

        if (!isCloud && (dragDeltaY.current !== 0 || dragDeltaX.current !== 0)) {
            group.rotation.y += dragDeltaY.current;
            group.rotation.x += dragDeltaX.current;
        }
        dragDeltaY.current = 0;
        dragDeltaX.current = 0;

        const target = shapes[targetShape.current];
        positions.current.forEach((p, i) => {
            p.lerp(isCloud ? wanderTgts.current[i]! : target[i]!, LERP);
            mat4.makeTranslation(p.x, p.y, p.z);
            nodesMesh.setMatrixAt(i, mat4);
        });
        nodesMesh.instanceMatrix.needsUpdate = true;

        knnLineMesh.visible    = !isJaguar;
        jaguarLineMesh.visible =  isJaguar;

        // Update KNN line geo (always, so it's ready when switching back)
        const knnAttr = knnLineGeo.attributes.position as THREE.BufferAttribute;
        const knnArr  = knnAttr.array as Float32Array;
        for (let e = 0; e < edgeIdx.length; e += 2) {
            const a    = positions.current[edgeIdx[e]!]!;
            const b    = positions.current[edgeIdx[e + 1]!]!;
            const base = e * 3;
            const hide = isCloud && a.distanceTo(b) > HERO_EDGE_MAX_DIST;
            knnArr[base]     = a.x; knnArr[base + 1] = a.y; knnArr[base + 2] = a.z;
            knnArr[base + 3] = hide ? a.x : b.x;
            knnArr[base + 4] = hide ? a.y : b.y;
            knnArr[base + 5] = hide ? a.z : b.z;
        }
        knnAttr.needsUpdate = true;

        // Update jaguar leap line geo (always, so morph transitions are seamless)
        const jAttr = jaguarLineGeo.attributes.position as THREE.BufferAttribute;
        const jArr  = jAttr.array as Float32Array;
        for (let e = 0; e < jaguarEdgeIdx.length; e += 2) {
            const a    = positions.current[jaguarEdgeIdx[e]!]!;
            const b    = positions.current[jaguarEdgeIdx[e + 1]!]!;
            const base = e * 3;
            jArr[base]     = a.x; jArr[base + 1] = a.y; jArr[base + 2] = a.z;
            jArr[base + 3] = b.x; jArr[base + 4] = b.y; jArr[base + 5] = b.z;
        }
        jAttr.needsUpdate = true;

    });

    return (
        <>
            <fog attach="fog" args={["#0a0e0c", 9, 22]} />
            <group ref={groupRef} />
        </>
    );
}

// ─── wrapper ──────────────────────────────────────────────────────────────────
export function PortfolioBackground() {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const t1 = gsap.fromTo(wrapper, { opacity: 1 }, {
            opacity: 0.25,
            ease: "none",
            scrollTrigger: {
                trigger: "#about",
                start: "top bottom",
                end:   "top top",
                scrub: 0.8,
            },
        });
        return () => {
            t1.scrollTrigger?.kill(); t1.kill();
        };
    }, []);

    return (
        <div
            ref={wrapperRef}
            style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }}
            aria-hidden="true"
        >
            <Canvas
                camera={{ position: [0, 0, 7], fov: 50 }}
                style={{ width: "100%", height: "100%" }}
                gl={{ antialias: true, alpha: true }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}

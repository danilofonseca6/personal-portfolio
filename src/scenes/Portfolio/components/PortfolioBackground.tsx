import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const NODE_COUNT = 45;
const EDGE_DENSITY = 1.6;
const WANDER_DURATION = 8;

type Node = { id: number; x: number; y: number };
type Edge = { from: number; to: number };

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random(),
        y: Math.random(),
    }));
    const k = Math.round(EDGE_DENSITY);
    const edges: Edge[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
        const distances = nodes
            .filter((other) => other.id !== node.id)
            .map((other) => ({ id: other.id, d: Math.hypot(other.x - node.x, other.y - node.y) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, k);
        for (const { id: otherId } of distances) {
            const key = node.id < otherId ? `${node.id}-${otherId}` : `${otherId}-${node.id}`;
            if (!seen.has(key)) {
                seen.add(key);
                edges.push({ from: node.id, to: otherId });
            }
        }
    }
    return { nodes, edges };
}

export function PortfolioBackground() {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { nodes, edges } = useMemo(() => buildGraph(), []);

    // Wander nodes
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const nodeEls = nodes.map((n) => svg.querySelector<SVGCircleElement>(`#pbg-node-${n.id}`));
        const edgeEls = edges.map((_, i) => svg.querySelector<SVGLineElement>(`#pbg-edge-${i}`));
        const sim = nodes.map((n) => ({ ...n }));

        sim.forEach((node) => {
            const wander = () => {
                gsap.to(node, {
                    x: Math.random(),
                    y: Math.random(),
                    duration: WANDER_DURATION * (0.7 + Math.random() * 0.6),
                    ease: "sine.inOut",
                    onComplete: wander,
                });
            };
            wander();
        });

        const tick = () => {
            for (let i = 0; i < sim.length; i++) {
                const node = sim[i];
                const el = nodeEls[i];
                if (node && el) {
                    el.setAttribute("cx", String(node.x * 100));
                    el.setAttribute("cy", String(node.y * 100));
                }
            }
            for (let i = 0; i < edges.length; i++) {
                const e = edges[i];
                const el = edgeEls[i];
                if (!e || !el) continue;
                const a = sim[e.from];
                const b = sim[e.to];
                if (!a || !b) continue;
                el.setAttribute("x1", String(a.x * 100));
                el.setAttribute("y1", String(a.y * 100));
                el.setAttribute("x2", String(b.x * 100));
                el.setAttribute("y2", String(b.y * 100));
            }
        };

        gsap.ticker.add(tick);
        return () => {
            gsap.ticker.remove(tick);
            sim.forEach((node) => gsap.killTweensOf(node));
        };
    }, [nodes, edges]);

    // Dim slightly as sections scroll into view so cards read clearly against it
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const t = gsap.fromTo(wrapper, { opacity: 1 }, {
            opacity: 0.2,
            ease: "none",
            scrollTrigger: {
                trigger: "#now-working",
                start: "top bottom",
                end: "top top",
                scrub: 0.8,
            },
        });
        return () => { t.scrollTrigger?.kill(); t.kill(); };
    }, []);

    return (
        <div
            ref={wrapperRef}
            style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }}
            aria-hidden="true"
        >
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
            >
                {edges.map((_, i) => (
                    <line key={i} id={`pbg-edge-${i}`} stroke="var(--green-dim)" strokeWidth="0.08" strokeOpacity="0.6" />
                ))}
                {nodes.map((n) => (
                    <circle key={n.id} id={`pbg-node-${n.id}`} r="0.3" fill="var(--green)" />
                ))}
            </svg>
        </div>
    );
}

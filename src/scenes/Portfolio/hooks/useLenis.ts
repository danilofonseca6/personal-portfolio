import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisStore } from "../lenisStore";

gsap.registerPlugin(ScrollTrigger);

// How close to a section centre (as fraction of viewport height) before we snap
const SNAP_RADIUS = 0.28;

export function useLenis() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
        });

        lenisStore.instance = lenis;

        lenis.on("scroll", ScrollTrigger.update);

        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // Snap to the nearest section centre after scroll settles.
        // Only fires within SNAP_RADIUS of a section — gives gentle magnetic
        // resistance without forcing hard full-page jumps.
        let snapTimer: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            if (lenisStore.stopped) return;
            clearTimeout(snapTimer);
            snapTimer = setTimeout(() => {
                if (lenisStore.stopped) return;

                const sections = Array.from(
                    document.querySelectorAll("section[id]")
                ) as HTMLElement[];

                const mid   = window.innerHeight / 2;
                const limit = window.innerHeight * SNAP_RADIUS;
                let bestEl: HTMLElement | null = null;
                let bestDist = Infinity;

                for (const el of sections) {
                    const rect   = el.getBoundingClientRect();
                    const centre = rect.top + rect.height / 2;
                    const dist   = Math.abs(centre - mid);
                    if (dist < bestDist) { bestDist = dist; bestEl = el; }
                }

                // 20px dead-zone so we don't re-snap a section already centred
                if (bestEl && bestDist > 20 && bestDist < limit) {
                    lenis.scrollTo(bestEl, {
                        offset:   -(window.innerHeight - bestEl.offsetHeight) / 2,
                        duration: 0.55,
                        easing:   (t: number) => 1 - Math.pow(1 - t, 3),
                    });
                }
            }, 120);
        };

        lenis.on("scroll", onScroll);

        return () => {
            clearTimeout(snapTimer);
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisStore.instance = null;
            lenisStore.stopped  = false;
        };
    }, []);
}
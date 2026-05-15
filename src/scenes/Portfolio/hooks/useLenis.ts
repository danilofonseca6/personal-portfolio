import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenisStore } from "../lenisStore";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sets up Lenis smooth scroll AND wires it into GSAP's ticker + ScrollTrigger.
 *
 * The integration:
 * 1. Lenis intercepts wheel events for smooth scroll
 * 2. On every Lenis scroll, we tell ScrollTrigger to recheck its triggers
 * 3. We drive Lenis from GSAP's ticker (not requestAnimationFrame directly),
 *    so they share the same frame schedule
 * 4. We disable GSAP's default lag-smoothing since Lenis handles that
 */
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

        // Tell ScrollTrigger to recheck on every Lenis scroll event
        lenis.on("scroll", ScrollTrigger.update);

        // Drive Lenis from GSAP's ticker so everything shares one frame loop
        const tick = (time: number) => {
            lenis.raf(time * 1000);  // GSAP ticker provides time in seconds
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisStore.instance = null;
        };
    }, []);
}
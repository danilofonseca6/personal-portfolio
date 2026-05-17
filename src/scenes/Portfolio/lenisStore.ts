import type Lenis from "lenis";

export const lenisStore: { instance: Lenis | null; stopped: boolean } = {
    instance: null,
    stopped:  false,
};

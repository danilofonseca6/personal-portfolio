// The whole experience moves through these phases

export type SceneState = "desk" | "diving" | "awake" | "exiting";

// What scene controller needs to dispatch
export type SceneAction =
    | { type: "START_DIVE" }
    | { type: "DIVE_COMPLETE" }
    | { type: "START_EXIT" }
    | { type: "EXIT_COMPLETE" };
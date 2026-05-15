// Mutable singleton read by the Three.js scene each frame.
// Write from anywhere; the camera lerps toward these values in useFrame.
export const cameraTarget = {
    z: 7,   // default camera z
};

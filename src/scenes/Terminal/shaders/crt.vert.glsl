varying vec2 vUv;

void main() {
  // Three.js gives us `uv` (per-vertex texture coords, 0,0 to 1,1)
  // and `position` (vertex position in 3D space).
  // We pass uv through to the fragment shader.
  vUv = uv;

  // Standard transformation: object space → world space → camera space → screen space.
  // `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` is the canonical
  // "put this 3D point on the 2D screen" formula. We'll use it verbatim.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

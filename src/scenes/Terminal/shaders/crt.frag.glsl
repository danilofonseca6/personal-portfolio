// Fragment shader runs once per pixel

precision mediump float;

varying vec2 vUv;

void main() {
    vec3 phsophor = vec3(0.2, 1.0, 0.4);

    gl_FragColor = vec4(phosphor, 1.0);
}
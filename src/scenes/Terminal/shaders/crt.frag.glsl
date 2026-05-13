precision mediump float;

varying vec2 vUv;
uniform float uTime;
uniform sampler2D uFont;
uniform float uScreenState;
uniform float uBootProgress;
uniform float uPromptProgress;
uniform float uDiveProgress;
uniform float uShowPortfolioPrompt;

const float COLS = 32.0;
const float ROWS = 12.0;


vec2 curveUV(vec2 uv, float amount) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = uv.yx * uv.yx;
    uv += uv * offset * amount;
    return uv * 0.5 + 0.5;
}


vec3 sampleChar(float charCode, vec2 localUv) {
    float col = mod(charCode, 16.0);
    float row = floor(charCode / 16.0);

    localUv.y = 1.0 - localUv.y;

    vec2 atlasOrigin = vec2(col, row) / 16.0;
    vec2 atlasUv = atlasOrigin + localUv / 16.0;
    atlasUv.y = 1.0 - atlasUv.y;

    vec4 fontSample = texture2D(uFont, atlasUv);
    float intensity = fontSample.r;
    if (fontSample.r > 0.9 && fontSample.g < 0.1 && fontSample.b > 0.9) intensity = 0.0;
    return vec3(intensity);
}


float charAt(float col, float row) {
    if (row == 1.0) {
        if (col == 4.0) return 83.0;
        if (col == 5.0) return 89.0;
        if (col == 6.0) return 83.0;
        if (col == 7.0) return 84.0;
        if (col == 8.0) return 69.0;
        if (col == 9.0) return 77.0;
        if (col == 11.0) return 118.0;
        if (col == 12.0) return 48.0;
        if (col == 13.0) return 46.0;
        if (col == 14.0) return 57.0;
        if (col == 15.0) return 46.0;
        if (col == 16.0) return 55.0;
        if (col == 18.0) return 45.0;
        if (col == 20.0) return 100.0;
        if (col == 21.0) return 97.0;
        if (col == 22.0) return 110.0;
        if (col == 23.0) return 105.0;
        if (col == 24.0) return 108.0;
        if (col == 25.0) return 111.0;
        if (col == 26.0) return 46.0;
        if (col == 27.0) return 111.0;
        if (col == 28.0) return 115.0;
    }
    if (row == 3.0) {
        if (col == 4.0) return 108.0;
        if (col == 5.0) return 111.0;
        if (col == 6.0) return 97.0;
        if (col == 7.0) return 100.0;
        if (col == 8.0) return 101.0;
        if (col == 9.0) return 100.0;
        if (col == 10.0) return 58.0;
        if (col == 12.0) return 105.0;
        if (col == 13.0) return 100.0;
        if (col == 14.0) return 101.0;
        if (col == 15.0) return 110.0;
        if (col == 16.0) return 116.0;
        if (col == 17.0) return 105.0;
        if (col == 18.0) return 116.0;
        if (col == 19.0) return 121.0;
        if (col == 20.0) return 46.0;
        if (col == 21.0) return 100.0;
        if (col == 22.0) return 97.0;
        if (col == 23.0) return 116.0;
        if (col == 25.0) return 111.0;
        if (col == 26.0) return 107.0;
    }
    if (row == 5.0) {
        if (col == 4.0) return 97.0;
        if (col == 5.0) return 119.0;
        if (col == 6.0) return 97.0;
        if (col == 7.0) return 105.0;
        if (col == 8.0) return 116.0;
        if (col == 9.0) return 105.0;
        if (col == 10.0) return 110.0;
        if (col == 11.0) return 103.0;
        if (col == 13.0) return 104.0;
        if (col == 14.0) return 97.0;
        if (col == 15.0) return 110.0;
        if (col == 16.0) return 100.0;
        if (col == 17.0) return 115.0;
        if (col == 18.0) return 104.0;
        if (col == 19.0) return 97.0;
        if (col == 20.0) return 107.0;
        if (col == 21.0) return 101.0;
    }
    return 32.0;
}

float charAtOff(float col, float row) {
    if (row == 10.0) {
        if (col == 11.0) return 91.0;   // [
        if (col == 13.0) return 99.0;   // c
        if (col == 14.0) return 108.0;  // l
        if (col == 15.0) return 105.0;  // i
        if (col == 16.0) return 99.0;   // c
        if (col == 17.0) return 107.0;  // k
        if (col == 19.0) return 93.0;   // ]
    }
    return 32.0;
}

// "> press to see portfolio_" — 25 chars, centred-ish on row 7.
// Starts at col 4, ends at col 28.
float charAtPrompt(float col, float row) {
    if (row == 7.0) {
        if (col == 4.0)  return 62.0;   // >
        if (col == 6.0)  return 112.0;  // p
        if (col == 7.0)  return 114.0;  // r
        if (col == 8.0)  return 101.0;  // e
        if (col == 9.0)  return 115.0;  // s
        if (col == 10.0) return 115.0;  // s
        if (col == 12.0) return 116.0;  // t
        if (col == 13.0) return 111.0;  // o
        if (col == 15.0) return 115.0;  // s
        if (col == 16.0) return 101.0;  // e
        if (col == 17.0) return 101.0;  // e
        if (col == 19.0) return 112.0;  // p
        if (col == 20.0) return 111.0;  // o
        if (col == 21.0) return 114.0;  // r
        if (col == 22.0) return 116.0;  // t
        if (col == 23.0) return 102.0;  // f
        if (col == 24.0) return 111.0;  // o
        if (col == 25.0) return 108.0;  // l
        if (col == 26.0) return 105.0;  // i
        if (col == 27.0) return 111.0;  // o
    }
    return 32.0;
}


vec3 sampleOff(vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        return vec3(0.0);
    }
    float col = floor(uv.x * COLS);
    float row = floor((1.0 - uv.y) * ROWS);
    vec2 localUv = fract(uv * vec2(COLS, ROWS));
    float charCode = charAtOff(col, row);
    vec3 charPixel = sampleChar(charCode, localUv);
    vec3 phosphor = vec3(0.1, 0.5, 0.2);
    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    return charPixel * phosphor * (0.4 + 0.6 * pulse);
}


vec3 samplePattern(vec2 uv) {
    uv = clamp(uv, 0.0, 1.0);

    float col = floor(uv.x * COLS);
    float row = floor((1.0 - uv.y) * ROWS);

    vec2 localUv = fract(uv * vec2(COLS, ROWS));

    float charCode = charAt(col, row);

    vec3 charPixel = sampleChar(charCode, localUv);
    vec3 phosphor = vec3(0.2, 1.0, 0.4);
    vec3 background = vec3(0.0, 0.0, 0.0);
    return charPixel * phosphor + background;
}


float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

void main() {
    vec2 uv = curveUV(vUv, 0.15 + uDiveProgress * 0.2);

    // Jitter
    float frame = floor(uTime * 60.0);
    vec2 jitter = vec2(hash(frame) - 0.5, hash(frame + 1.0) - 0.5) * 0.0005;
    uv += jitter;

    bool isOff = uScreenState < 0.5;
    bool isBooting = uScreenState > 0.5 && uScreenState < 1.5;

    float thisCol = floor(uv.x * COLS);
    float thisRow = floor((1.0 - uv.y) * ROWS);

    // ---- Per-line typing for boot lines (rows 1, 3, 5) ----
    float lineStart[3];
    float lineEnd[3];
    lineStart[0] = 4.0; lineEnd[0] = 28.0;  // row 1
    lineStart[1] = 4.0; lineEnd[1] = 26.0;  // row 3
    lineStart[2] = 4.0; lineEnd[2] = 22.0;  // row 5

    float lineIdx = -1.0;
    if (thisRow == 1.0) lineIdx = 0.0;
    else if (thisRow == 3.0) lineIdx = 1.0;
    else if (thisRow == 5.0) lineIdx = 2.0;

    bool isHidden = false;
    bool isCursorHere = false;

    if (isBooting) {
        float phase = floor(uBootProgress * 3.0);
        phase = min(phase, 2.0);
        float phaseProgress = fract(uBootProgress * 3.0);
        if (uBootProgress >= 0.999) {
            phase = 2.0;
            phaseProgress = 1.0;
        }

        if (lineIdx < 0.0) {
            isHidden = true;
        } else if (lineIdx > phase) {
            isHidden = true;
        } else if (lineIdx < phase) {
            // fully typed
        } else {
            float lineLen = lineEnd[int(lineIdx)] - lineStart[int(lineIdx)] + 1.0;
            float typedInLine = phaseProgress * lineLen;
            float currentTypingCol = lineStart[int(lineIdx)] + typedInLine;

            if (thisCol > currentTypingCol) {
                isHidden = true;
            }
            if (abs(thisCol - floor(currentTypingCol)) < 0.5 && thisCol >= lineStart[int(lineIdx)]) {
                isCursorHere = true;
            }
        }
    }


    bool isReady = uScreenState > 1.5;

    // Prompt rendering with its own typewriter via uPromptProgress.
    // Prompt occupies cols 4..27 on row 7. Typing position interpolates.
    float promptStart = 4.0;
    float promptEnd   = 27.0;
    float promptLen   = promptEnd - promptStart + 1.0;
    float promptTypedCol = promptStart + uPromptProgress * promptLen;

    bool isPromptRow = isReady && thisRow == 7.0 && uShowPortfolioPrompt > 0.5;
    bool isPromptCharVisible = isPromptRow && thisCol <= promptTypedCol && thisCol >= promptStart;
    bool isPromptTypingCursor = isPromptRow
        && uPromptProgress < 1.0
        && abs(thisCol - floor(promptTypedCol)) < 0.5
        && thisCol >= promptStart;

    // Persistent cursor: when prompt typing complete, cursor sits AFTER
    // the prompt text on row 7 (col 28). Before prompt typing, cursor sits
    // after the awaiting-handshake line on row 5 (col 22). If the prompt
    // is hidden (off/booting), no persistent cursor for the prompt row.
    bool isPersistentCursorRow5 = isReady && uShowPortfolioPrompt < 0.5 && thisRow == 5.0 && thisCol == 22.0;
    bool isPersistentCursorRow7 = isReady && uShowPortfolioPrompt > 0.5 && uPromptProgress >= 0.999 && thisRow == 7.0 && thisCol == 28.0;
    bool isPersistentCursor = isPersistentCursorRow5 || isPersistentCursorRow7;

    vec3 color;

    if (isOff) {
        color = sampleOff(uv);
    } else if (isHidden) {
        color = vec3(0.0);
    } else if (isCursorHere || isPersistentCursor || isPromptTypingCursor) {
        float blinkSpeed = isPersistentCursor ? 1.5 : 3.0;
        float cursorBlink = step(0.3, fract(uTime * blinkSpeed));
        color = vec3(0.4, 1.0, 0.5) * cursorBlink;
    } else if (isPromptCharVisible) {
        vec2 localUv = fract(uv * vec2(COLS, ROWS));
        float charCode = charAtPrompt(thisCol, thisRow);
        vec3 charPixel = sampleChar(charCode, localUv);
        float pulse = 0.6 + 0.4 * sin(uTime * 2.5);
        float hoverBoost = step(1.5, uShowPortfolioPrompt);
        float intensity = mix(pulse, 1.0, hoverBoost);
        // Only pulse once typing is complete — while typing, render at full bright
        float typingBoost = step(1.0, uPromptProgress);
        intensity = mix(1.0, intensity, typingBoost);
        color = charPixel * vec3(0.3, 1.0, 0.5) * intensity;
    } else {
        float dist = length(uv - vec2(0.5));
        vec2 dir = (uv - vec2(0.5));
        float aberration = 0.012 + uDiveProgress * 0.025;
        float r = samplePattern(uv + dir * aberration * dist).r;
        float g = samplePattern(uv).g;
        float b = samplePattern(uv - dir * aberration * dist).b;
        color = vec3(r, g, b);

        vec3 glow = vec3(0.0);
        float glowRadius = 0.006;
        glow += samplePattern(uv + vec2( glowRadius,  0.0));
        glow += samplePattern(uv + vec2(-glowRadius,  0.0));
        glow += samplePattern(uv + vec2( 0.0,  glowRadius));
        glow += samplePattern(uv + vec2( 0.0, -glowRadius));
        glow *= 0.25;
        color += glow * 0.1;
    }

    // Scanlines
    float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);
    color *= (0.85 - uDiveProgress * 0.15) + scanline * (0.15 + uDiveProgress * 0.25);

    // Flicker
    float flicker = sin(uTime * 60.0) * sin(uTime * 6.3);
    float flickerStrength = isOff ? 0.05 : 0.01;
    color *= 1.0 - flickerStrength * flicker;

    // Vignette
    float vignetteDist = length(uv - vec2(0.5));
    float vignette = 1.0 - vignetteDist * (1.2 + uDiveProgress * 0.8);
    vignette = clamp(vignette, 0.0, 1.0);
    color *= vignette;
    color *= 1.0 + uDiveProgress * 0.4;
    color *= 2.0;

    gl_FragColor = vec4(color, 1.0);
}
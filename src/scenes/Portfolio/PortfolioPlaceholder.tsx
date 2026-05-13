import { Html } from "@react-three/drei";

export function PortfolioPlaceholder() {
    return (
        <Html
            fullscreen
            style={{
                pointerEvents: "auto",
            }}
        >
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    background: "#0a0a0a",
                    color: "#e0ffe8",
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2rem",
                    padding: "2rem",
                }}
            >
                <h1 style={{
                    fontSize: "clamp(2rem, 6vw, 4.5rem)",
                    margin: 0,
                    letterSpacing: "0.05em",
                    color: "#33ff66",
                    textShadow: "0 0 30px rgba(51, 255, 102, 0.4)",
                }}>
                    you made it.
                </h1>

                <p style={{
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    color: "#a0d8b0",
                    maxWidth: "32ch",
                    textAlign: "center",
                    lineHeight: 1.6,
                    margin: 0,
                }}>
                    welcome to the inside. portfolio content goes here — projects, work, contact.
                </p>

                <div style={{
                    position: "absolute",
                    bottom: "2rem",
                    fontSize: "0.85rem",
                    color: "#557766",
                    opacity: 0.6,
                }}>
                    ↩ return to terminal
                </div>
            </div>
        </Html>
    );
}
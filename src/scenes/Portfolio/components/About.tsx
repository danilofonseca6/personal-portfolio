import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./About.module.css";

gsap.registerPlugin(ScrollTrigger);

const STACK = [
    "Python", "TypeScript", "Go", "Rust",
    "Django", "React", "PostgreSQL", "GCP",
    "Terraform", "Docker", "NL2SQL / RAG",
];

export function About() {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const card = cardRef.current;
        if (!section || !card) return;

        // Set invisible before trigger fires so there's no flash on page load
        gsap.set(card, { scale: 0.84, opacity: 0, y: 16 });

        const tween = gsap.to(card, {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "back.out(1.6)",
            scrollTrigger: {
                trigger: section,
                start: "top 62%",
                once: true,
            },
        });

        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
        };
    }, []);

    return (
        <section id="about" ref={sectionRef} className={styles.section}>
            <div ref={cardRef} className={styles.card}>
                <p className={styles.label}>Full Stack Engineer</p>

                <h2 className={styles.headline}>
                    Four years building<br />things that ship.
                </h2>

                <p className={styles.bio}>
                    I've built{" "}
                    <strong>accounting SaaS</strong>,{" "}
                    <strong>AI tooling</strong> that lets accountants query live client data in plain English,
                    validated embedded systems at{" "}
                    <strong>Jaguar Land Rover</strong>, and written a{" "}
                    <strong>Rust liquidation bot running on Solana mainnet</strong> — with live capital.
                    I take ownership of the full SDLC: from whiteboard to production, CI/CD to post-deployment support.
                    I'm equally at home as the sole engineer on a product or as a contributor in an agile team.
                </p>

                <div className={styles.divider} />

                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <span className={styles.metaDot} />
                        Manchester — open to remote / relocation
                    </span>
                    <span className={styles.metaItem}>
                        <span className={styles.metaDot} />
                        MSc Software Engineering · Warwick
                    </span>
                    <span className={styles.metaItem}>
                        <span className={styles.metaDot} />
                        danilodavidfonseca@gmail.com
                    </span>
                </div>

                <div className={styles.stack}>
                    {STACK.map((s) => (
                        <span key={s} className={styles.chip}>{s}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}

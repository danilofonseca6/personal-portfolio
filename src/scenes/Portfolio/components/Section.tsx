import { ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Section.module.css";

gsap.registerPlugin(ScrollTrigger);

type SectionProps = {
    id: string;
    side?: "left" | "right" | "center";
    children: ReactNode;
};

export function Section({ id, side = "left", children }: SectionProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const card = cardRef.current;
        if (!section || !card) return;

        const fromX = side === "left" ? -80 : side === "right" ? 80 : 0;
        const tween = gsap.fromTo(
            card,
            { x: fromX, y: 20, opacity: 0, scale: 0.97 },
            {
                x: 0,
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top center",  // fires at scroll=50vh — card rising into view
                    once: true,
                },
            }
        );

        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
        };
    }, [side]);

    const cardClass =
        side === "left" ? styles.cardLeft :
            side === "right" ? styles.cardRight :
                styles.cardCenter;

    return (
        <section id={id} ref={sectionRef} className={styles.section}>
            <div className={styles.content}>
                <div ref={cardRef} className={cardClass}>
                    {children}
                </div>
            </div>
        </section>
    );
}

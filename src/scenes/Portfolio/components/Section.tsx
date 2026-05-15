import { ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Section.module.css";

gsap.registerPlugin(ScrollTrigger);

type SectionProps = {
    id: string;
    side?: "left" | "right" | "center";
    wide?: boolean;
    compact?: boolean;
    children: ReactNode;
};

export function Section({ id, side = "left", wide = false, compact = false, children }: SectionProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const card = cardRef.current;
        if (!section || !card) return;

        gsap.set(card, { scale: 0.4, opacity: 0 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top center",
                once: true,
            },
        });

        tl.to(card, { scale: 1.07, opacity: 1, duration: 0.38, ease: "power4.out" })
          .to(card, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.42)" });

        return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
        };
    }, []);

    const cardClass =
        side === "left"  ? (wide ? styles.cardLeftWide  : styles.cardLeft)  :
        side === "right" ? (wide ? styles.cardRightWide : styles.cardRight) :
        styles.cardCenter;

    return (
        <section id={id} ref={sectionRef} className={`${styles.section} ${compact ? styles.sectionCompact : ""}`}>
            <div className={`${styles.content} ${compact ? styles.contentCompact : ""}`}>
                <div ref={cardRef} className={cardClass}>
                    {children}
                </div>
            </div>
        </section>
    );
}

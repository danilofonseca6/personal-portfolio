import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Hero.module.css";

export function Hero() {
    const nameRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const el = nameRef.current;
        if (!el) return;

        const name = el.textContent ?? "";
        el.innerHTML = name
            .split("")
            .map((char) =>
                char === " "
                    ? `<span class="${styles.space}">&nbsp;</span>`
                    : `<span class="${styles.letter}">${char}</span>`
            )
            .join("");

        const letters = el.querySelectorAll(`.${styles.letter}`);

        gsap.from(letters, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.04,
            delay: 0.3,
        });
    }, []);

    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <h1 ref={nameRef} className={styles.name}>
                    Danilo Fonseca
                </h1>
            </div>
        </section>
    );
}

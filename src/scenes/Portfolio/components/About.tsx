import { Section } from "./Section";
import styles from "./About.module.css";

export function About() {
    return (
        <Section id="about" side="right">
            <article className={styles.card}>
                <p className={styles.label}>Full Stack Engineer · Manchester</p>

                <p className={styles.bio}>
                    Full stack engineer currently at <strong>Menzies LLP</strong>, where I've independently
                    architected and shipped accounting tools, an <strong>AI chatbot</strong> that lets
                    accountants query live client data in plain English via NL2SQL, and CI/CD pipelines
                    across GCP and Azure. Before that, a year at <strong>Jaguar Land Rover</strong> on the
                    VITAL V&amp;V team — running HIL rig tests against live ECU signals using dSPACE and
                    MATLAB. On the side I maintain <strong>YMAT</strong>, a personal finance app with open
                    banking integration, and a <strong>Rust liquidation bot</strong> targeting the MarginFi
                    protocol on Solana mainnet — operating with live capital.
                </p>

                <div className={styles.meta}>
                    <span className={styles.metaItem}>danilodavidfonseca@gmail.com · 07578 717474</span>
                    <span className={styles.metaItem}>MSc Software Engineering · University of Warwick</span>
                    <span className={styles.metaItem}>Open to remote / relocation</span>
                </div>
            </article>
        </Section>
    );
}

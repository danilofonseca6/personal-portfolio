import { Section } from "./Section";
import styles from "./NowWorking.module.css";

export function NowWorking() {
    return (
        <Section id="now-working" side="left">
            <article className={styles.card}>
                <div className={styles.label}>
                    <span className={styles.dot} />
                    <span>now</span>
                </div>
                <h2 className={styles.title}>
                    building a solana liquidation bot
                </h2>
                <p className={styles.description}>
                    rewriting from Go to Rust for performance. currently scaffolding
                    the RPC connection layer with failover and rebuilding the
                    MarginFi account indexer for sub-second liquidation triggers.
                </p>
                <div className={styles.tags}>
                    <span className={styles.tag}>rust</span>
                    <span className={styles.tag}>solana</span>
                    <span className={styles.tag}>marginfi</span>
                </div>
            </article>
        </Section>
    );
}

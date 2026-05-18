import { Section } from "./Section";
import styles from "./Contact.module.css";

export function Contact() {
    return (
        <Section id="contact" side="center" compact top>
            <article className={styles.card}>
                <p className={styles.label}>
                    <span className={styles.dot} />
                    Contact
                </p>

                <h2 className={styles.heading}>Get in touch</h2>

                <div className={styles.rows}>
                    <a href="mailto:danilodavidfonseca@gmail.com" className={styles.row}>
                        <span className={styles.rowKey}>EMAIL</span>
                        <span className={styles.rowVal}>danilodavidfonseca@gmail.com</span>
                    </a>
                   
                    <a
                        href="https://www.linkedin.com/in/danilo-fonseca-04917b228/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.row}
                    >
                        <span className={styles.rowKey}>LINKEDIN</span>
                        <span className={styles.rowVal}>www.linkedin.com/in/danilo-fonseca-04917b228/</span>
                    </a>
                    <a
                        href="https://github.com/danilofonseca6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.row}
                    >
                        <span className={styles.rowKey}>GITHUB</span>
                        <span className={styles.rowVal}>github.com/danilofonseca6</span>
                    </a>
                </div>
            </article>
        </Section>
    );
}

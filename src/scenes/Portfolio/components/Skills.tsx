import { Section } from "./Section";
import styles from "./Skills.module.css";

const SKILLS = [
    {
        category: "Languages",
        items: ["Python", "TypeScript", "JavaScript", "Go", "Rust", "C / C++"],
    },
    {
        category: "Frameworks & Libraries",
        items: ["Django", "Django REST Framework", "React", "Supabase"],
    },
    {
        category: "Data & AI",
        items: ["PostgreSQL", "BigQuery", "GCP Vector Search", "NL2SQL / RAG"],
    },
    {
        category: "Infrastructure & DevOps",
        items: ["Docker", "Terraform", "GCP", "Azure", "GitHub Actions", "Vercel"],
    },
];

export function Skills() {
    return (
        <Section id="skills" side="left">
            <article className={styles.card}>
                <p className={styles.label}>Core Skills</p>
                <div className={styles.groups}>
                    {SKILLS.map(({ category, items }) => (
                        <div key={category} className={styles.group}>
                            <span className={styles.category}>{category}</span>
                            <div className={styles.chips}>
                                {items.map((item) => (
                                    <span key={item} className={styles.chip}>{item}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </article>
        </Section>
    );
}

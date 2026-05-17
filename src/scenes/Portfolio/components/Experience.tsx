import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { Section } from "./Section";
import { cameraTarget } from "../cameraStore";
import { 
    lenisStore } from "../lenisStore";
import styles from "./Experience.module.css";

type Job = {
    id:       string;
    side:     "left" | "right";
    company:  string;
    role:     string;
    period:   string;
    bullets:  string[];
    tags:     string[];
    overview: string;
    details:  string[];
};

const JOBS: Job[] = [
    {
        id:      "exp-menzies",
        side:    "right",
        company: "Menzies LLP",
        role:    "Full Stack Engineer · Manchester",
        period:  "2023 – present",
        bullets: [
            "Independently architected and shipped internal accounting tools",
            "Built an AI chatbot for NL2SQL queries over live client data",
            "CI/CD pipelines across GCP and Azure",
        ],
        tags: ["TypeScript", "React", "Python", "GCP", "Azure", "NL2SQL"],
        overview:
            "Joined as the sole full-stack engineer on the internal tooling team at one of the UK's largest mid-market accounting firms. Took full ownership of the development cycle — from architecture through to production deployment.",
        details: [
            "Designed and built an AI-powered chatbot that translates plain-English questions into SQL against a multi-tenant client database, cutting data retrieval time significantly for account managers",
            "Shipped several internal accounting automation tools — reconciliation helpers, client reporting dashboards — independently from spec to production",
            "Provisioned and maintained CI/CD infrastructure across GCP (Cloud Run, Cloud SQL) and Azure DevOps",
            "Worked directly with stakeholders across the firm to scope requirements and iterate on tooling",
        ],
    },
    {
        id:      "exp-jlr",
        side:    "left",
        company: "Jaguar Land Rover",
        role:    "Software Engineer – VITAL V&V · Coventry",
        period:  "2022 – 2023",
        bullets: [
            "Ran HIL rig tests against live ECU signals on the VITAL platform",
            "Automated test sequences using dSPACE and MATLAB",
            "Analysed signal behaviour for formal V&V sign-off",
        ],
        tags: ["MATLAB", "dSPACE", "Python", "HIL", "CAN bus"],
        overview:
            "Part of the VITAL (Vehicle Integration Testing and Automation Lab) V&V team, responsible for verifying body electronics ECU behaviour against specification using Hardware-in-the-Loop test rigs.",
        details: [
            "Developed and executed HIL test cases against live ECU signals connected via dSPACE ControlDesk hardware",
            "Wrote MATLAB scripts to automate test sequence execution, capture CAN bus signal data, and produce analysis outputs",
            "Documented signal anomalies and test outcomes for formal verification sign-off against automotive specification",
        ],
    },
    {
        id:      "exp-ymat",
        side:    "right",
        company: "YMAT",
        role:    "Side project · Personal finance",
        period:  "ongoing",
        bullets: [
            "Personal finance app with UK open banking integration",
            "Full-stack — ingestion pipeline, categorisation, spend dashboard",
        ],
        tags: ["Open Banking", "TypeScript"],
        overview:
            "A personal finance application that connects to UK bank accounts via Open Banking APIs to automatically aggregate and categorise transactions across accounts.",
        details: [
            "Integrated with UK Open Banking APIs to pull live transaction data from connected accounts",
            "Built a categorisation engine and spend dashboard to surface insights across accounts and time periods",
        ],
    },
];

// ─── single card ──────────────────────────────────────────────────────────────

type CardProps = {
    job:      Job;
    isOpen:   boolean;
    onOpen:   () => void;
    onClose:  () => void;
};

function JobCard({ job, isOpen, onOpen, onClose }: CardProps) {
    const detailRef  = useRef<HTMLDivElement>(null);
    const summaryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const detail  = detailRef.current;
        const summary = summaryRef.current;
        if (!detail || !summary) return;

        // Skip on first mount — initial state already set via inline styles
        if (detail.style.display === "none" && !isOpen) return;

        gsap.killTweensOf([detail, summary]);

        if (isOpen) {
            // Fade summary out, then swap + fade detail in. Height changes while invisible — no snap.
            gsap.to(summary, {
                opacity: 0,
                duration: 0.15,
                ease: "power2.in",
                onComplete: () => {
                    summary.style.display = "none";
                    detail.style.display  = "block";
                    gsap.fromTo(detail, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
                },
            });
        } else {
            gsap.to(detail, {
                opacity: 0,
                duration: 0.15,
                ease: "power2.in",
                onComplete: () => {
                    detail.style.display  = "none";
                    summary.style.display = "block";
                    gsap.fromTo(summary, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
                },
            });
        }
    }, [isOpen]);

    // Escape key closes
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    return (
        <article
            className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}
            data-job-card={job.id}
            onClick={isOpen ? undefined : onOpen}
            role={isOpen ? undefined : "button"}
            tabIndex={isOpen ? undefined : 0}
            onKeyDown={isOpen ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
            aria-label={isOpen ? undefined : `Read more about ${job.company}`}
        >
            {/* always-visible header */}
            <div className={styles.header}>
                <div>
                    <h2 className={styles.company}>{job.company}</h2>
                    <p className={styles.role}>{job.role}</p>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.period}>{job.period}</span>
                    {isOpen && (
                        <button className={styles.close} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* summary (compact bullets) */}
            <div ref={summaryRef} className={styles.summary}>
                    <ul className={styles.bullets}>
                        {job.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                    <div className={styles.tags}>
                        {job.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                    </div>
                    <span className={styles.hint}>click to expand</span>
            </div>

            {/* detail (hidden until open) */}
            <div ref={detailRef} className={styles.detail} style={{ display: "none" }}>
                <p className={styles.overview}>{job.overview}</p>
                <ul className={styles.bullets}>
                    {job.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
                <div className={styles.tags}>
                    {job.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                </div>
            </div>
        </article>
    );
}

// ─── experience section ───────────────────────────────────────────────────────

export function Experience() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const open = useCallback((id: string) => {
        setActiveId(id);
        cameraTarget.z = 1.5;

        // Scroll the section to the viewport centre, then lock scroll
        const sectionEl = document.getElementById(id);
        if (sectionEl && lenisStore.instance) {
            lenisStore.instance.scrollTo(sectionEl, {
                offset:   -(window.innerHeight - sectionEl.offsetHeight) / 2,
                duration: 0.55,
                easing:   (t: number) => 1 - Math.pow(1 - t, 3),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onComplete: () => { lenisStore.stopped = true; (lenisStore.instance as any)?.stop(); },
            });
        } else {
            lenisStore.stopped = true;
            lenisStore.instance?.stop();
        }
    }, []);

    const close = useCallback(() => {
        setActiveId(null);
        cameraTarget.z = 7;
        lenisStore.stopped = false;
        lenisStore.instance?.start();
    }, []);

    // Click-outside to close
    useEffect(() => {
        if (!activeId) return;
        const handler = (e: MouseEvent) => {
            const card = document.querySelector(`[data-job-card="${activeId}"]`);
            if (card && !card.contains(e.target as Node)) close();
        };
        const timer = setTimeout(() => window.addEventListener("click", handler), 50);
        return () => { clearTimeout(timer); window.removeEventListener("click", handler); };
    }, [activeId, close]);

    return (
        <div style={{ position: "relative" }}>

            {JOBS.map((job) => (
                <Section key={job.id} id={job.id} side={job.side} compact>
                    <JobCard
                        job={job}
                        isOpen={activeId === job.id}
                        onOpen={() => open(job.id)}
                        onClose={close}
                    />
                </Section>
            ))}
        </div>
    );
}

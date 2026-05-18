import { useLenis } from "./hooks/useLenis";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Experience } from "./components/Experience";
import { NowWorking } from "./components/NowWorking";
import { Contact } from "./components/Contact";
import { PortfolioBackground } from "./components/PortfolioBackground";
import styles from "./styles/portfolio.module.css";

export function Portfolio() {
    useLenis();

    return (
        <div className={styles.root}>
            <PortfolioBackground />
            <main className={styles.main}>
                <Hero />
                <About />
                <Skills />
                <Experience />
                <NowWorking />
                <Contact />
            </main>
        </div>
    );
}

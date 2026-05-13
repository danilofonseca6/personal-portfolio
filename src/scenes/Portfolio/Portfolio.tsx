import { useLenis } from "./hooks/useLenis";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { NowWorking } from "./components/NowWorking";
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
                <NowWorking />
            </main>
        </div>
    );
}

import { Hero } from '@/components/Hero'
import { Portfolio } from '@/components/Portfolio'
import { Awards } from '@/components/Awards'
import { About } from '@/components/About'
import { Services } from '@/components/Services'
import { Team } from '@/components/Team'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'

const Index = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="relative" role="main">
                <section id="hero" aria-label="Hero section">
                    <Hero />
                </section>
                <section id="features" aria-label="Features section">
                    <Portfolio />
                </section>
                <section id="stats" aria-label="Stats section">
                    <Awards />
                </section>
                <section id="how-it-works" aria-label="How it works section">
                    <About />
                </section>
                <section id="technology" aria-label="Technology section">
                    <Services />
                </section>
                <section id="team" aria-label="Team section">
                    <Team />
                </section>
                <section id="contact" aria-label="Contact section">
                    <Contact />
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Index;
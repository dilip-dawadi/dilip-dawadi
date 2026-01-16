import Link from 'next/link';

import { getExperienceText } from '@/lib/experience';
import ThemePortrait from './ThemePortrait';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-avatar">
          <ThemePortrait width={160} height={160} priority />
        </div>

        <h1 className="hero-title">
          <span className="hero-name">Dilip Dawadi</span>
        </h1>

        <p className="hero-tagline">
          Full-Stack Software Developer building scalable web applications with{' '}
          <span className="hero-highlight">React</span>,{' '}
          <span className="hero-highlight">Node.js</span>, and{' '}
          <span className="hero-highlight">PostgreSQL</span>.
          <br />
          {getExperienceText()} of experience delivering production-ready solutions.
        </p>

        <div className="hero-chips">
          <span className="hero-chip">Toronto, Canada</span>
          <span className="hero-chip">Seneca College</span>
          <span className="hero-chip">DevOps & Cloud</span>
        </div>

        <div className="hero-cta">
          <Link href="/about" className="button button-primary">
            About Me
          </Link>
          <Link href="/resume" className="button button-secondary">
            View Resume
          </Link>
        </div>
      </div>

      <div className="hero-bg" aria-hidden="true">
        <div className="hero-gradient" />
      </div>
    </section>
  );
}

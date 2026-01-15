'use client';

import Personal from '@/components/Stats/Personal';
import PageWrapper from '@/components/Template/PageWrapper';

interface TechSkill {
  name: string;
  level: number; // 1-5
  category: string;
}

const techSkills: TechSkill[] = [
  // Frontend
  { name: 'React & Next.js', level: 5, category: 'Frontend' },
  { name: 'TypeScript', level: 5, category: 'Frontend' },
  { name: 'Tailwind CSS', level: 4, category: 'Frontend' },
  { name: 'React Query', level: 4, category: 'Frontend' },

  // Backend
  { name: 'Node.js & Express', level: 5, category: 'Backend' },
  { name: 'PostgreSQL', level: 5, category: 'Backend' },
  { name: 'REST APIs', level: 5, category: 'Backend' },
  { name: 'GraphQL', level: 4, category: 'Backend' },

  // DevOps
  { name: 'Docker', level: 4, category: 'DevOps' },
  { name: 'GitHub Actions', level: 4, category: 'DevOps' },
  { name: 'AWS', level: 3, category: 'DevOps' },
  { name: 'Linux', level: 4, category: 'DevOps' },
];

export default function StatsPage() {
  const frontendSkills = techSkills.filter((s) => s.category === 'Frontend');
  const backendSkills = techSkills.filter((s) => s.category === 'Backend');
  const devopsSkills = techSkills.filter((s) => s.category === 'DevOps');

  return (
    <PageWrapper>
      <section className="stats-page">
        <header className="stats-header">
          <h1 className="stats-title">More About Me</h1>
          <p className="stats-subtitle">My journey, interests, and what I'm working with</p>
        </header>
        <div className="stats-content">
          <section>
            <h2 className="stats-section-title">Quick Facts</h2>
            <Personal />
          </section>

          <section>
            <h2 className="stats-section-title">Frontend Skills</h2>
            <div className="skills-table">
              {frontendSkills.map((skill) => (
                <div key={skill.name} className="skill-row">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-bar-container">
                    <div
                      className="skill-bar-fill"
                      style={{ width: `${(skill.level / 5) * 100}%` }}
                    />
                  </div>
                  <div className="skill-level">{skill.level}/5</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="stats-section-title">Backend Skills</h2>
            <div className="skills-table">
              {backendSkills.map((skill) => (
                <div key={skill.name} className="skill-row">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-bar-container">
                    <div
                      className="skill-bar-fill"
                      style={{ width: `${(skill.level / 5) * 100}%` }}
                    />
                  </div>
                  <div className="skill-level">{skill.level}/5</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="stats-section-title">DevOps & Tools</h2>
            <div className="skills-table">
              {devopsSkills.map((skill) => (
                <div key={skill.name} className="skill-row">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-bar-container">
                    <div
                      className="skill-bar-fill"
                      style={{ width: `${(skill.level / 5) * 100}%` }}
                    />
                  </div>
                  <div className="skill-level">{skill.level}/5</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="stats-section-title">Current Focus</h2>
            <div className="stats-list">
              <div className="stats-item">
                <strong>Learning:</strong> Advanced system design and cloud architecture patterns
              </div>
              <div className="stats-item">
                <strong>Building:</strong> Production-grade applications with focus on scalability
              </div>
              <div className="stats-item">
                <strong>Exploring:</strong> AI/ML integration in web applications
              </div>
            </div>
          </section>

          <section>
            <h2 className="stats-section-title">Interests & Hobbies</h2>
            <div className="stats-list">
              <div className="stats-item">
                📚 Reading tech blogs and staying updated with trends
              </div>
              <div className="stats-item">🚀 Contributing to open-source projects</div>
              <div className="stats-item">💡 Experimenting with new technologies</div>
              <div className="stats-item">🎮 Gaming and tech documentaries</div>
            </div>
          </section>
        </div>
      </section>

      <style jsx>{`
        .skills-table {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .skill-row {
          display: grid;
          grid-template-columns: 200px 1fr 60px;
          align-items: center;
          gap: 1rem;
        }

        .skill-name {
          font-weight: 500;
        }

        .skill-bar-container {
          height: 24px;
          background: var(--color-bg-secondary);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .skill-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .skill-level {
          text-align: right;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .skill-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .skill-level {
            text-align: left;
          }
        }
      `}</style>
    </PageWrapper>
  );
}

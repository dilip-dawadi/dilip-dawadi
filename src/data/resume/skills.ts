export interface Skill {
  title: string;
  competency: number;
  category: string[];
}

export interface Category {
  name: string;
  color: string;
  /** Pre-computed text color for contrast - 'dark' for light backgrounds, 'light' for dark */
  textColor: 'dark' | 'light';
}

const skills: Skill[] = [
  // Languages
  {
    title: 'JavaScript',
    competency: 5,
    category: ['Languages', 'Web Development'],
  },
  {
    title: 'Java',
    competency: 4,
    category: ['Languages'],
  },
  {
    title: 'Python',
    competency: 4,
    category: ['Languages'],
  },
  {
    title: 'Node.js',
    competency: 5,
    category: ['Languages', 'Web Development'],
  },
  {
    title: 'SQL',
    competency: 5,
    category: ['Languages', 'Databases'],
  },
  // Frontend
  {
    title: 'React',
    competency: 5,
    category: ['Web Development'],
  },
  {
    title: 'React Query',
    competency: 4,
    category: ['Web Development'],
  },
  {
    title: 'Redux',
    competency: 4,
    category: ['Web Development'],
  },
  {
    title: 'Tailwind CSS',
    competency: 5,
    category: ['Web Development'],
  },
  // Backend
  {
    title: 'REST APIs',
    competency: 5,
    category: ['Web Development'],
  },
  {
    title: 'Spring Boot',
    competency: 4,
    category: ['Web Development'],
  },
  {
    title: 'Django',
    competency: 3,
    category: ['Web Development'],
  },
  // Databases
  {
    title: 'PostgreSQL',
    competency: 5,
    category: ['Databases'],
  },
  {
    title: 'MongoDB',
    competency: 4,
    category: ['Databases'],
  },
  // DevOps & Cloud
  {
    title: 'Docker',
    competency: 4,
    category: ['Infrastructure'],
  },
  {
    title: 'Jenkins',
    competency: 4,
    category: ['Infrastructure'],
  },
  {
    title: 'GitHub Actions',
    competency: 4,
    category: ['Infrastructure'],
  },
  {
    title: 'Git',
    competency: 5,
    category: ['Infrastructure'],
  },
  {
    title: 'AWS',
    competency: 4,
    category: ['Infrastructure'],
  },
  {
    title: 'Azure',
    competency: 3,
    category: ['Infrastructure'],
  },
  {
    title: 'DigitalOcean',
    competency: 3,
    category: ['Infrastructure'],
  },
  // Methodologies
  {
    title: 'Agile/Scrum',
    competency: 4,
    category: ['Other'],
  },
  {
    title: 'System Design',
    competency: 4,
    category: ['Other'],
  },
  {
    title: 'Performance Optimization',
    competency: 4,
    category: ['Other'],
  },
].map((skill) => ({ ...skill, category: skill.category.sort() }));

/**
 * Category colors with pre-computed text contrast.
 * Uses CSS custom properties defined in tailwind.css for runtime styling,
 * with textColor pre-computed from the hex values for accessibility.
 *
 * Hex values from tailwind.css @theme block:
 * --color-skill-1: #6968b3, --color-skill-2: #37b1f5, --color-skill-3: #40494e
 * --color-skill-4: #515dd4, --color-skill-5: #e47272, --color-skill-6: #cc7b94
 */
const CATEGORY_COLORS: { color: string; textColor: 'dark' | 'light' }[] = [
  { color: 'var(--color-skill-1)', textColor: 'light' }, // #6968b3 - dark bg
  { color: 'var(--color-skill-2)', textColor: 'dark' }, // #37b1f5 - light bg
  { color: 'var(--color-skill-3)', textColor: 'light' }, // #40494e - dark bg
  { color: 'var(--color-skill-4)', textColor: 'light' }, // #515dd4 - dark bg
  { color: 'var(--color-skill-5)', textColor: 'dark' }, // #e47272 - light bg
  { color: 'var(--color-skill-6)', textColor: 'dark' }, // #cc7b94 - light bg
];

// Fallback colors for categories beyond the predefined set (with pre-computed contrast)
const FALLBACK_COLORS: { color: string; textColor: 'dark' | 'light' }[] = [
  { color: '#3896e2', textColor: 'dark' },
  { color: '#c3423f', textColor: 'light' },
  { color: '#d75858', textColor: 'light' },
  { color: '#747fff', textColor: 'light' },
  { color: '#64cb7b', textColor: 'dark' },
];

/**
 * Build categories from skills with type-safe color assignment.
 * Logs a warning in development if there are more categories than colors.
 */
function buildCategories(skillsList: Skill[]): Category[] {
  const uniqueCategories = Array.from(
    new Set(skillsList.flatMap(({ category }) => category)),
  ).sort();

  const allColors = [...CATEGORY_COLORS, ...FALLBACK_COLORS];

  if (
    process.env.NODE_ENV === 'development' &&
    uniqueCategories.length > allColors.length
  ) {
    console.warn(
      `[skills.ts] Warning: ${uniqueCategories.length} categories but only ${allColors.length} colors defined`,
    );
  }

  return uniqueCategories.map((category, index) => {
    const colorConfig = allColors[index] ?? {
      color: '#888888',
      textColor: 'light' as const,
    };
    return {
      name: category,
      color: colorConfig.color,
      textColor: colorConfig.textColor,
    };
  });
}

const categories: Category[] = buildCategories(skills);

export { categories, skills };

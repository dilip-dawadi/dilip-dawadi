/**
 * Calculate years of professional experience based on start date
 * Returns experience in increments of 0.5 years (e.g., 2.5, 3, 3.5, 4, 4.5)
 */
export function calculateExperience(): number {
  const startDate = new Date('2022-01-01'); // Your career start date
  const currentDate = new Date();

  const diffInMilliseconds = currentDate.getTime() - startDate.getTime();
  const diffInYears = diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);

  // Round to nearest 0.5
  const roundedYears = Math.round(diffInYears * 2) / 2;

  return roundedYears;
}

/**
 * Get formatted experience string with "+" suffix
 * Example: "3.5+ years"
 */
export function getExperienceText(): string {
  const years = calculateExperience();
  return `${years}+ years`;
}

/**
 * Get experience for metadata/descriptions
 * Example: "3.5+"
 */
export function getExperienceShort(): string {
  const years = calculateExperience();
  return `${years}+`;
}

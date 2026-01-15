export interface Degree {
  school: string;
  degree: string;
  link: string;
  year: number;
}

const degrees: Degree[] = [
  {
    school: 'Seneca College',
    degree: 'Postgraduate Certificate - Database Application Developer',
    link: 'https://senecacollege.ca',
    year: 2024,
  },
  {
    school: 'Seneca College',
    degree: 'Postgraduate Certificate - Cloud Architecture & Administration',
    link: 'https://senecacollege.ca',
    year: 2025,
  },
];

export default degrees;

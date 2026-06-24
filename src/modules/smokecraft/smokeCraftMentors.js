// SmokeCraft 360 — Master Mentor roster.
// Extracted from src/pages/smokecraft/Mentor.jsx (Phase 2 module separation)
// so mentor data is a standalone, reusable config rather than hardcoded
// inside the screen component.
//
// APPROVED SMOKECRAFT MENTOR VISUAL RULE:
// Mentor cards must use realistic portraits only.
// Do not replace with cartoon avatars, placeholder faces, emoji art, or flat vector people.

export const MENTORS = [
  {
    id: 'dominican',
    country: 'Dominican Republic',
    countryCode: 'DO',
    flag: '🇩🇴',
    name: 'Don Alejandro',
    bio: 'Master of volcanic soil nutrients and the delicate art of Olor wrapper fermentation.',
    tags: ['Complexity', 'Floral Notes'],
    image: '/mentors/don-alejandro.jpg',
    greeting: 'I am Don Alejandro. Volcanic soil and the patience of centuries — I will teach you to read the earth within a single Olor wrapper.',
  },
  {
    id: 'nicaragua',
    country: 'Nicaragua',
    countryCode: 'NI',
    flag: '🇳🇮',
    name: 'Javier Estelí',
    bio: "Specialist in sun-grown Criollo '98 and the robust spice profiles of Jalapa Valley.",
    tags: ['Bold', 'Earth / Spice'],
    image: '/mentors/javier-esteli.jpg',
    greeting: 'Javier Estelí. My valley demands boldness. The spice you taste in Jalapa tobacco is the result of relentless sun and uncompromising craft.',
  },
  {
    id: 'honduras',
    country: 'Honduras',
    countryCode: 'HN',
    flag: '🇭🇳',
    name: 'Doña Jamastran',
    bio: 'Legacy grower of authentic Corojo seed and the intense, full-bodied traditions of Danlí.',
    tags: ['Authentic', 'Rich Cedar'],
    image: '/mentors/dona-jamastran.jpg',
    greeting: "I am Doña Jamastran. Five generations of Corojo in the highlands of Danlí. My family's legacy is in every leaf — I will pass it on to you.",
  },
  {
    id: 'mexico',
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    name: 'Mateo San Andrés',
    bio: "Guardian of the Negro San Andrés leaf, the world's most sought-after Maduro wrapper.",
    tags: ['Dark Cocoa', 'Maduro Expert'],
    image: '/mentors/mateo-san-andres.jpg',
    greeting: "Mateo San Andrés. The Negro Maduro wrapper holds the darkest secrets in tobacco. Complex, honest, and alive. Your education starts now.",
  },
  {
    id: 'cuba',
    country: 'Cuba',
    countryCode: 'CU',
    flag: '🇨🇺',
    name: 'Maestro Rafael',
    bio: 'Keeper of classic Cuban-seed tradition, elegant draw discipline, and old-world rolling standards.',
    tags: ['Tradition', 'Balance'],
    image: '/mentors/maestro-rafael.jpg',
    greeting: 'Maestro Rafael. Tradition is not nostalgia. It is a standard. I will teach you how balance becomes elegance.',
  },
  {
    id: 'peru',
    country: 'Peru',
    countryCode: 'PE',
    flag: '🇵🇪',
    name: 'Carlos Mendoza',
    bio: 'Andean curator of altitude-grown aromatics, mineral sweetness, and rare leaf experimentation.',
    tags: ['Altitude', 'Aromatics'],
    image: '/mentors/carlos-mendoza.jpg',
    greeting: 'Carlos Mendoza. In the high valleys, tobacco learns restraint and brightness. Let us find the lift inside the leaf.',
  },
  {
    id: 'florida',
    country: 'USA (Florida)',
    countryCode: 'US',
    flag: '🇺🇸',
    name: 'Thomas A. Blackwell',
    bio: 'Modern lounge strategist blending hospitality, humidor discipline, and contemporary cigar service.',
    tags: ['Lounge Craft', 'Service'],
    image: '/mentors/thomas-blackwell.jpg',
    greeting: 'Thomas Blackwell. A great cigar experience is engineered before the first light. I will guide the ritual around the smoke.',
  },
  {
    id: 'brazil',
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    name: 'Dr. Paulo Oliveira',
    bio: 'Mata Fina researcher focused on natural sweetness, earthy depth, and scientific tasting language.',
    tags: ['Mata Fina', 'Research'],
    image: '/mentors/paulo-oliveira.jpg',
    greeting: "Dr. Paulo Oliveira. Brazil's leaf is generous but exacting. I will teach you to measure sweetness without losing soul.",
  },
]

export const MAX_MENTOR_SELECTIONS = 2

export function getMentorById(id) {
  return MENTORS.find(m => m.id === id) || null
}
